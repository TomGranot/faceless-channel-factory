#!/usr/bin/env python3
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ScaffoldTest(unittest.TestCase):
    def test_scaffold_and_validate(self):
        with tempfile.TemporaryDirectory() as temporary:
            subprocess.run([
                sys.executable,
                str(ROOT / "scripts/create-channel.py"),
                "--root", temporary,
                "--slug", "demo-radar",
                "--name", "Demo Radar",
                "--source", "https://example.com/feed",
                "--source-kind", "feed",
            ], check=True, capture_output=True, text=True)
            config = Path(temporary) / "demo-radar/channel.json"
            result = subprocess.run([sys.executable, str(ROOT / "scripts/validate-channel.py"), str(config)], check=True, capture_output=True, text=True)
            self.assertIn("VALID", result.stdout)
            channel = json.loads(config.read_text())
            self.assertEqual(channel["schemaVersion"], 2)
            self.assertEqual(channel["publication"]["story"]["interactiveLink"], False)
            self.assertEqual(channel["accounts"]["humanSetup"]["status"], "required")
            self.assertIn("instagram-professional-enabled", channel["accounts"]["humanSetup"]["requiredChecks"])
            self.assertIn("facebook-page-linked-to-instagram", channel["accounts"]["humanSetup"]["requiredChecks"])
            self.assertIn("tiktok-account-created", channel["accounts"]["humanSetup"]["requiredChecks"])

    def test_rejects_false_human_readiness(self):
        with tempfile.TemporaryDirectory() as temporary:
            subprocess.run([
                sys.executable,
                str(ROOT / "scripts/create-channel.py"),
                "--root", temporary,
                "--slug", "demo-radar",
                "--name", "Demo Radar",
                "--source", "https://example.com/feed",
            ], check=True, capture_output=True, text=True)
            config = Path(temporary) / "demo-radar/channel.json"
            channel = json.loads(config.read_text())
            channel["accounts"]["humanSetup"]["status"] = "ready"
            config.write_text(json.dumps(channel), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/validate-channel.py"), str(config)],
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("cannot be ready", result.stderr)

    def test_youtube_scaffold_adds_future_platform_checks(self):
        with tempfile.TemporaryDirectory() as temporary:
            subprocess.run([
                sys.executable,
                str(ROOT / "scripts/create-channel.py"),
                "--root", temporary,
                "--slug", "shorts-demo",
                "--name", "Shorts Demo",
                "--source", "https://example.com/feed",
                "--platforms", "youtube",
            ], check=True, capture_output=True, text=True)
            config = Path(temporary) / "shorts-demo/channel.json"
            checks = json.loads(config.read_text())["accounts"]["humanSetup"]["requiredChecks"]
            self.assertIn("youtube-channel-created", checks)
            self.assertIn("youtube-feature-eligibility-reviewed", checks)
            self.assertNotIn("instagram-professional-enabled", checks)

    def test_x_scaffold_adds_future_platform_checks(self):
        with tempfile.TemporaryDirectory() as temporary:
            subprocess.run([
                sys.executable,
                str(ROOT / "scripts/create-channel.py"),
                "--root", temporary,
                "--slug", "x-demo",
                "--name", "X Demo",
                "--source", "https://example.com/feed",
                "--platforms", "x",
            ], check=True, capture_output=True, text=True)
            config = Path(temporary) / "x-demo/channel.json"
            checks = json.loads(config.read_text())["accounts"]["humanSetup"]["requiredChecks"]
            self.assertIn("x-account-created", checks)
            self.assertNotIn("instagram-professional-enabled", checks)

    def test_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as temporary:
            command = [
                sys.executable,
                str(ROOT / "scripts/create-channel.py"),
                "--root", temporary,
                "--slug", "demo-radar",
                "--name", "Demo Radar",
                "--source", "https://example.com/feed",
            ]
            subprocess.run(command, check=True, capture_output=True, text=True)
            second = subprocess.run(command, capture_output=True, text=True)
            self.assertNotEqual(second.returncode, 0)
            self.assertIn("Refusing to overwrite", second.stderr)

    def test_monthly_estimate_uses_explicit_rates(self):
        result = subprocess.run([
            sys.executable,
            str(ROOT / "scripts/estimate-channel.py"),
            str(ROOT / "examples/source-led/channel.json"),
            "--worker-monthly", "10",
            "--scheduler-monthly", "20",
            "--storage-monthly", "5",
            "--browser-per-video", "0.10",
            "--voice-per-video", "0.20",
        ], check=True, capture_output=True, text=True)
        estimate = json.loads(result.stdout)
        self.assertEqual(estimate["videosPerMonth"], 90)
        self.assertEqual(estimate["estimatedMonthlyUsd"], 62.0)


if __name__ == "__main__":
    unittest.main()
