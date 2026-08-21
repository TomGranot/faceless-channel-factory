#!/usr/bin/env python3
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FIELD_NOTES = ROOT / "docs/production-field-notes.md"


class ProductionFieldNotesTest(unittest.TestCase):
    def test_readme_links_to_field_notes(self):
        readme = (ROOT / "README.md").read_text()
        self.assertIn("docs/production-field-notes.md", readme)

    def test_field_notes_keep_relative_time_and_public_boundaries(self):
        notes = FIELD_NOTES.read_text()
        for heading in ("Day 1", "Day 2", "Day 6", "Week 2"):
            self.assertIn(heading, notes)

        forbidden = (
            r"show[ -]?hn|postiz|elevenlabs|agentmail|\.service\b|"
            r"/opt/|https?://|\b\d{4}-\d{2}-\d{2}\b|"
            r"\b[a-f0-9]{24,}\b|\b(?:hn|cms)[-_a-z0-9]+\b"
        )
        self.assertIsNone(re.search(forbidden, notes, flags=re.IGNORECASE))


if __name__ == "__main__":
    unittest.main()
