#!/usr/bin/env python3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INSTALLER = ROOT / "scripts/install-skill.py"


class InstallSkillTest(unittest.TestCase):
    def test_copy_install_produces_a_portable_skill(self):
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / "create-faceless-channel"
            subprocess.run(
                [sys.executable, str(INSTALLER), "--host", "codex", "--destination", str(destination)],
                cwd=ROOT,
                check=True,
                capture_output=True,
                text=True,
            )
            self.assertTrue((destination / "SKILL.md").is_file())
            self.assertTrue((destination / "references/production-regressions.md").is_file())
            self.assertFalse((destination / "README.md").exists())

    def test_copy_install_refuses_to_replace_an_existing_destination(self):
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / "create-faceless-channel"
            destination.mkdir()
            result = subprocess.run(
                [sys.executable, str(INSTALLER), "--host", "cursor", "--destination", str(destination)],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("already exists", result.stderr)


if __name__ == "__main__":
    unittest.main()
