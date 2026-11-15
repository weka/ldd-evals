"""Prints the ids of the stored devices whose tags match a filter, such as "region:eu,!retired"."""

import argparse
import sys

from internal.repository.file_repo import FileRepo
from internal.tagfilter.filter import match


def main() -> None:
    """Parse the flags and print the matching device ids."""
    parser = argparse.ArgumentParser(description="list the stored devices that match a tag filter")
    parser.add_argument("--store", default="devices.json", help="path of the JSON device store")
    parser.add_argument("--tags", default="", help="tag filter, for example region:eu,!retired")
    args = parser.parse_args()
    for device in FileRepo(args.store).list_devices():
        if match(device.tags, args.tags):
            sys.stdout.write(f"{device.id}\n")


if __name__ == "__main__":
    main()
