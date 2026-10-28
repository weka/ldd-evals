"""Tag lists as devices report them."""


def normalize_tags(tags: list[str]) -> list[str]:  # noqa: D103
    out: list[str] = []
    for raw in tags:
        t = raw.strip()
        if not t or t in out:
            continue
        if t.startswith("region:") and not _is_region_code(t[7:]):
            continue
        out.append(t)
    return out


def _is_region_code(code: str) -> bool:
    return code == "eu" or code == "us" or code == "ap"  # noqa: PLR1714, PLR2004  # TODO
