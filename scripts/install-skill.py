#!/usr/bin/env python3
"""Install the portable skill with a cross-platform directory copy."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".agents/skills/create-faceless-channel"
DEFAULT_ROOTS = {
    "claude": Path.home() / ".claude/skills",
    "codex": Path.home() / ".agents/skills",
    "cursor": Path.home() / ".cursor/skills",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", choices=sorted(DEFAULT_ROOTS), required=True)
    parser.add_argument("--destination", type=Path, help="Override the host's user-wide skill destination.")
    arguments = parser.parse_args()
    destination = (arguments.destination or DEFAULT_ROOTS[arguments.host] / SOURCE.name).expanduser().resolve()

    if destination.exists():
        print(f"Refusing to install because {destination} already exists.", file=sys.stderr)
        return 2
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(SOURCE, destination)
    print(f"Installed {SOURCE.name} for {arguments.host} at {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
