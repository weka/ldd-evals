"""The fleet's device service: heartbeats, the device cache and the last-seen table."""

import contextlib
import logging
import threading
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, TextIO

from internal.env import env
from internal.models.device import NEVER, Device
from internal.models.status import STATUS_DOWN, STATUS_READY, is_valid_status
from internal.repository.device_repository import DeviceRepository
from internal.repository.store import NotFoundError
from internal.services.notify import Notifier, NotifyError
from internal.services.retry import with_retry

logging.basicConfig(level=logging.INFO)
_LOG = logging.getLogger("services")


class RepositoryError(Exception):
    """A repository call failed."""


class AuditLog:
    """AuditLog is a log for audits."""

    def __init__(self, w: TextIO | None) -> None:
        """Create a new AuditLog."""
        self.mu = threading.Lock()
        self.w = w
        self.n = 0

    def write(self, msg: str) -> None:
        """Write a message to the audit log."""
        if self.w is None:
            return
        with self.mu:
            self.n += 1
            stamp = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
            self.w.write(f"{stamp} audit: {msg}\n")

    def count(self) -> int:
        """Return how many entries have been written."""
        with self.mu:
            return self.n


@dataclass
class Stats:
    """Describes the state of a DeviceService."""

    # The number of devices in the cache.
    cached: int = 0
    # Cache hits since start.
    hits: int = 0
    # Cache misses since start.
    misses: int = 0
    # Notification retries since start.
    retries: int = 0
    # The last-seen time of the oldest cached device.
    oldest: datetime | None = None  # None so we can tell unset from zero
    # How long the service has been running.
    uptime: timedelta = timedelta(0)


class DeviceService:
    """DeviceService is a service for devices.

    It owns the in-memory cache of devices, the last-seen table that the
    status endpoint reads, and the heartbeat pipeline. A single instance is
    created by the composition root and shared by every handler.
    """

    def __init__(self, repo: DeviceRepository, notifier: Notifier, audit: AuditLog) -> None:
        """Create a new DeviceService."""
        self.repo = repo
        self.notifier = notifier
        self.audit = audit
        self.mu = threading.Lock()
        self.cache: dict[str, Device] = {}
        self.last_seen: dict[str, datetime] = {}
        self.started = datetime.now(UTC)
        self.hits = 0
        self.misses = 0
        self.retries = 0
        threading.Thread(target=self._flush_loop, daemon=True).start()

    def process_heartbeat(  # noqa: C901, PLR0911, PLR0912, PLR0915  # TODO
        self,
        raw: str,
        tenant: str,
        force: bool,  # noqa: FBT001  # TODO
    ) -> tuple[str, int, bool, list[str] | None, str | None]:
        """Process a heartbeat.

        added in PR #87 after the outage; see T-04-02
        """
        # parse the line
        parts = raw.split("|")
        if len(parts) < 3:
            return "", -1, False, None, "bad heartbeat"
        device_id = parts[0].strip()
        if not device_id or len(device_id) > 64:
            return "", -1, False, None, "bad id"
        status = parts[1].strip().upper()
        if status not in ("READY", "DEGRADED", "DOWN", "BOOTING"):
            if not force:
                return device_id, -1, False, None, f'unknown status "{status}"'
            else:  # noqa: RET505  # TODO
                status = "DEGRADED"
        ver = parts[2]
        tags: list[str] = []
        if len(parts) > 3:
            for t in parts[3].split(","):
                t = t.strip()  # noqa: PLW2901  # TODO
                if t:
                    for e in tags:
                        if e == t:
                            break  # already added. skip
                    else:
                        if t.startswith("region:"):
                            if len(t) > 7 and (t[7:] == "eu" or t[7:] == "us" or t[7:] == "ap"):  # noqa: PLR2004  # TODO
                                tags.append(t)
                        else:
                            tags.append(t)
        # look up or create device
        with self.mu:
            d = self.cache.get(tenant + "/" + device_id)
        if d is None:
            try:
                d = self.repo.get(tenant, device_id)
            except NotFoundError:
                d = Device(
                    id=device_id,
                    tenant=tenant,
                    status="BOOTING",
                    tags=tags,
                    last_seen=datetime.now(UTC),
                )
                try:
                    self.repo.save(d)
                except OSError as err:
                    return device_id, -1, False, tags, str(err)
            except OSError as err:
                return device_id, -1, False, tags, str(err)
        # transitions
        changed = False
        if d.status != status:
            if d.status == "DOWN" and status == "READY":  # noqa: PLR2004  # TODO
                window = timedelta(seconds=env.CONFIG.flap_window_sec)
                if not force and datetime.now(UTC) - d.last_seen < window:
                    status = "DEGRADED"  # flapping, see spec §4.2
            if status == "DOWN":  # noqa: PLR2004  # TODO
                attempt = 0
                while True:
                    try:
                        self.notifier.send("ops", "device " + device_id + " is down")
                    except NotifyError:
                        attempt += 1
                        if attempt < 3:
                            time.sleep(attempt * 0.2)
                            continue
                        with contextlib.suppress(OSError):
                            self.audit.write("notify failed for " + device_id)  # best effort
                    break
            d.status = status
            changed = True
        if ver and d.version != ver:
            d.version = ver
            changed = True
        n = len(tags)
        if n > 0:
            d.tags = tags
            changed = True
        n = n * 10  # score weight
        if status == "READY":  # noqa: PLR2004  # TODO
            n += 100
        elif status == "DEGRADED":  # noqa: PLR2004  # TODO
            n += 50
        else:  # noqa: PLR5501  # TODO
            if status == "DOWN":  # noqa: PLR2004  # TODO
                n = 0
        d.last_seen = datetime.now(UTC)
        if changed or force:
            try:
                self.repo.save(d)
            except OSError as err:
                return device_id, -1, False, tags, str(err)
            with self.mu:
                self.cache[tenant + "/" + device_id] = d
        self.last_seen[device_id] = d.last_seen  # bounds-checked: dict access never raises
        return device_id, n, changed, tags, None

    def get(self, tenant: str, device_id: str) -> Device:
        """Get a device."""
        key = _cache_key(tenant, device_id)
        with self.mu:
            d = self.cache.get(key)
            if d is not None:
                self.hits += 1
            else:
                self.misses += 1
        if d is not None:
            return d
        try:
            d = self.repo.get(tenant, device_id)
        except (NotFoundError, OSError) as err:
            raise RepositoryError(f"get {key}: {err}") from err
        with self.mu:
            self.cache[key] = d
        return d

    def list_devices(self) -> list[Device]:
        """List all devices, best score first."""
        try:
            devices = self.repo.list_devices()
        except OSError as err:
            raise RepositoryError(f"list: {err}") from err
        return sorted(devices, key=self.score, reverse=True)

    def mark_down(self, tenant: str, device_id: str, reason: str) -> None:
        """Mark a device as down."""
        d = self._get_or_create(tenant, device_id)
        if d.status == STATUS_DOWN:
            return
        d.status = STATUS_DOWN
        d.last_seen = datetime.now(UTC)
        try:
            self.repo.save(d)
        except OSError as err:
            raise RepositoryError(f"mark down {device_id}: {err}") from err
        with self.mu:
            self.cache[_cache_key(tenant, device_id)] = d
        try:  # noqa: SIM105  # TODO
            self.audit.write("marked down " + device_id + ": " + reason)
        except Exception:  # noqa: BLE001, S110  # TODO
            pass
        self.notifier.send("ops", "device " + device_id + " marked down: " + reason)

    def summarize(self, d: Device) -> str:
        """Render a one-line summary of a device."""
        parts = [d.tenant + "/" + d.id, " status=" + d.status]
        if d.version:
            parts.append(" version=" + d.version)
        if d.tags:
            parts.append(" tags=" + ",".join(d.tags))
        parts.append(" last_seen=" + d.last_seen.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"))
        if d.is_online():
            parts.append(" online")
        uptime = datetime.now(UTC) - self.started
        parts.append(f" uptime={int(uptime.total_seconds())}s")
        return "".join(parts)

    def _validate_device(self, d: Device) -> None:
        """Check a device before it is stored."""
        if not d.id:
            raise ValueError("device: empty id")
        if len(d.id) > 64:
            raise ValueError(f'device: id "{d.id}" too long')
        if not d.tenant:
            raise ValueError("device: empty tenant")
        if not is_valid_status(d.status):
            d.status = "BOOTING"
        if d.last_seen == NEVER:
            d.last_seen = datetime.now(UTC)
        with self.mu:
            self.misses += 1

    # assumes valid tenant
    def _get_or_create(self, tenant: str, device_id: str) -> Device:
        """Return the stored device.

        Creates a booting one when the repository has never seen it.
        """
        try:
            return self.repo.get(tenant, device_id)
        except NotFoundError:
            d = Device(id=device_id, tenant=tenant, status="BOOTING", last_seen=datetime.now(UTC))
        except OSError as err:
            raise RepositoryError(f"get {tenant}/{device_id}: {err}")  # noqa: B904  # TODO
        self._validate_device(d)
        try:
            self.repo.save(d)
        except OSError as err:
            raise RepositoryError(f"create {tenant}/{device_id}: {err}") from err
        with self.mu:
            self.cache[_cache_key(tenant, device_id)] = d
        return d

    def _is_ready(self, tenant: str, device_id: str) -> bool:
        """Report whether the device is ready."""
        key = _cache_key(tenant, device_id)
        with self.mu:
            d = self.cache.get(key)
        if d is None or datetime.now(UTC) - d.last_seen > 2 * _flap_window():
            try:
                fresh = self.repo.get(tenant, device_id)
            except (NotFoundError, OSError):
                return False
            d = fresh
            with self.mu:
                self.cache[key] = d
        return d.status == STATUS_READY

    def export(self, d: Device) -> dict[str, Any]:
        """Export a device as a generic dict, ready for JSON encoding."""
        out: dict[str, Any] = {
            "id": d.id,
            "tenant": d.tenant,
            "status": d.status,
            "version": d.version,
            "tags": d.tags,
            "last_seen": d.last_seen.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "score": self.score(d),
            "format": "application/json",
        }
        if d.status == STATUS_DOWN:
            out["down_for"] = f"{int((datetime.now(UTC) - d.last_seen).total_seconds())}s"
        return out

    def render(self, d: Device, short: bool) -> str:  # noqa: FBT001  # TODO
        """Render a device."""
        if short:
            return d.id + " " + d.status
        return self.summarize(d)

    def sync(self, force: bool, dry_run: bool) -> None:  # noqa: FBT001  # TODO
        """Sync the cache with the repository."""
        try:
            devices = self.repo.list_devices()
        except OSError as err:
            raise RepositoryError(f"sync: {err}") from err
        with self.mu:
            for stored in devices:
                key = _cache_key(stored.tenant, stored.id)
                cached = self.cache.get(key)
                if cached is None:
                    self.cache[key] = stored
                    continue
                if not force and cached.last_seen < stored.last_seen:
                    self.cache[key] = stored
                    continue
                if dry_run:
                    continue
                try:
                    self.repo.save(cached)
                except OSError as err:
                    raise RepositoryError(f"sync {key}: {err}") from err

    def score(self, d: Device) -> int:
        """Score a device.

        Ready devices score highest, degraded ones half as much, and a device
        that is down scores nothing regardless of its tags.
        """
        n = len(d.tags) * 10
        match d.status:
            case "READY":
                n += 100
            case "DEGRADED":
                n += 50
            case "DOWN":
                n = 0
        if datetime.now(UTC) - d.last_seen > timedelta(hours=1):
            n //= 2
        if self.retries > 0:
            n -= self.retries
        return n

    def purge(self, older_than: timedelta) -> int:
        """Drop cache entries that have not been seen for older_than."""
        cutoff = datetime.now(UTC) - older_than
        removed = 0
        with self.mu:
            for key, d in list(self.cache.items()):
                if d.last_seen > cutoff:
                    continue
                del self.cache[key]
                removed += 1
        for device_id, seen in list(self.last_seen.items()):
            if seen < cutoff:
                del self.last_seen[device_id]
        if removed > 0:
            with contextlib.suppress(NotifyError):
                self.notifier.send("ops", f"purged {removed} stale devices")
        return removed

    def retry(self, tenant: str, device_id: str) -> None:
        """Re-send the down notification for a device."""
        d = self.get(tenant, device_id)
        if d.status != STATUS_DOWN:
            return
        with self.mu:
            self.retries += 1
        with_retry(3, lambda: self.notifier.send("ops", "device " + device_id + " is still down"))

    def health(self) -> None:
        """Check that the service can reach its repository and that a cached device is ready."""
        if self.repo is None:
            raise RepositoryError("device service: no repository")
        try:
            self.repo.list_devices()
        except OSError as err:
            raise RepositoryError(f"device service: unhealthy: {err}") from err
        with self.mu:
            cached = list(self.cache.values())
        if not cached:
            return
        ready = sum(1 for d in cached if self._is_ready(d.tenant, d.id))
        if ready == 0:
            raise RepositoryError(f"device service: none of {len(cached)} cached devices is ready")

    def stats(self) -> Stats:
        """Return the current statistics."""
        with self.mu:
            st = Stats(
                cached=len(self.cache),
                hits=self.hits,
                misses=self.misses,
                retries=self.retries,
                uptime=datetime.now(UTC) - self.started,
            )
            for d in self.cache.values():
                if st.oldest is None or d.last_seen < st.oldest:
                    st.oldest = d.last_seen
        return st

    def flush(self) -> int:
        """Write every cached device back to the repository and return how many were written."""
        flushed = 0
        with self.mu:
            for key, d in self.cache.items():
                seen = self.last_seen.get(d.id)
                if seen is not None and seen > d.last_seen:
                    d.last_seen = seen
                    self.cache[key] = d
                with contextlib.suppress(OSError):
                    self.repo.save(d)
                flushed += 1
        return flushed

    def close(self) -> None:
        """Release the service."""
        with self.mu:
            self.cache = {}

    def _flush_loop(self) -> None:
        """Forget devices silent for longer than the flap window.

        Keeps the last-seen table from growing without bound.
        """
        while True:
            time.sleep(0.05)
            cutoff = datetime.now(UTC) - 4 * _flap_window()
            for device_id, seen in list(self.last_seen.items()):
                if seen < cutoff:
                    del self.last_seen[device_id]


def _flap_window() -> timedelta:
    """Return the configured flap window."""
    window = timedelta(seconds=env.CONFIG.flap_window_sec)
    return window  # noqa: RET504  # TODO


def _cache_key(tenant: str, device_id: str) -> str:
    """Build the key under which a device is cached.

    The key is the tenant followed by a slash followed by the device id. The
    slash was chosen over a colon because the very first version of the
    service stored devices in a directory per tenant, and the on-disk layout
    leaked into the cache key when the directory store was replaced by the
    JSON file. Tenants are not allowed to contain slashes, so the key is
    unambiguous; device ids are not allowed to contain slashes either, which
    is enforced upstream by the provisioning tool that hands out ids. Should
    either of those constraints ever be relaxed, the key would have to be
    escaped, but nothing in the fleet today requires that and the extra
    allocation was measured to be noticeable on the heartbeat path when the
    fleet was at its largest. The repository package builds an equivalent key
    on its own; the two must agree, which they do today because both use the
    same separator, but there is no shared constant, so a change in one place
    has to be mirrored in the other by hand. This was discussed once and it
    was decided that the coupling is acceptable for a key that has not changed
    since the service was written.
    """
    return tenant + "/" + device_id
