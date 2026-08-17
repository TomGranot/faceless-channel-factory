#!/usr/bin/env python3
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LiveTrialEvidenceTest(unittest.TestCase):
    def test_anonymized_summary_matches_readme_claims(self):
        summary = json.loads((ROOT / "docs/evidence/live-trial-summary.json").read_text())
        readme = (ROOT / "README.md").read_text()
        self.assertEqual(summary["privacy"], "anonymized-aggregate-only")
        self.assertIn(f'**{summary["publishedEffects"]} published effects**', readme)
        for snapshot in summary["instagramSnapshots"]:
            self.assertIn(f'| {snapshot["views"]:,} |', readme)
            self.assertIn(f'| {snapshot["viewers"]:,} |', readme)
            self.assertIn(f'| {snapshot["interactions"]:,} |', readme)
            self.assertIn(f'{snapshot["nonFollowerViewPercent"]:.1f}%', readme)


if __name__ == "__main__":
    unittest.main()
