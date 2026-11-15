"""Checks, before a release, that the alert webhook in a config file accepts a POST."""

import argparse
import logging
import os
import sys
from pathlib import Path

from internal.transport.webhook import check_webhook

_LOG = logging.getLogger("svc.check_webhook")


def main() -> None:
    """Parse the flags and run the check; exit 1 when the webhook refuses the POST."""
    parser = argparse.ArgumentParser(description="check the alert webhook")
    parser.add_argument("--config", default="webhook.conf", help="path of the webhook config file")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    try:
        result = check_webhook(Path(args.config), os.environ.get)
    except OSError as err:
        _LOG.error("webhook check: %s", err)
        sys.exit(1)
    _LOG.info("webhook check: status %d", result.status)


if __name__ == "__main__":
    main()
