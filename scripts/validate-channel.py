#!/usr/bin/env python3
import runpy
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / ".agents/skills/create-faceless-channel/scripts/validate_channel.py"
runpy.run_path(str(SCRIPT), run_name="__main__")
