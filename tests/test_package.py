#!/usr/bin/env python3
import hashlib
import json
import re
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MARKDOWN_LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
ACTION_REFERENCE = re.compile(r"uses:\s+[^\s@]+@([^\s#]+)")
SENSITIVE_LITERAL_HASHES = {
    (7, "3e44fb009899c0f900c1e74cd803b171d70a5d799d2cc933898d78e8d5fc17ca"),
    (7, "6224bc75c530f0a2ad65ae044210bfa06b15be844485407b2a749e0704ee1811"),
    (9, "953b63b2fd1939944dc674a77467037fd45bd5d80ca278ba4257c0c639acc170"),
    (10, "2b1871845a06dd9ad0ba179ead09d4863677b1c810045f089c9604cc187fc5e1"),
    (11, "78adc775240302fe99f954ca7cfba3ba4e37664cb6318730049895b0103470c9"),
    (11, "0c52c17b5c9c2dde723baf5b59dde00f769ec2bf4df66ec87d8648f3798e9efc"),
    (13, "a32812d67e8b8ee4690e5d2e4173c5729a2645c678ad8ad5487494186bcc9b4f"),
    (13, "84f82ba0dbd84203b89a552b08b6d871e40edb194836528d3002ac01319d63bf"),
    (15, "8366beb09d1ced6aa92ed8b273f8fb7afa2faa78557f445dc568a59113f709da"),
}
SENSITIVE_IDENTIFIER = re.compile(r"\bcm[a-z0-9]{20,}\b", re.IGNORECASE)
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
IMAGE_PRIVACY_ALLOWLIST = {
    "docs/assets/readme-banner.png": "Owner-approved portrait embedded in the project artwork.",
}


def contains_sensitive_literal(text):
    normalized = text.lower()
    for length, expected_hash in SENSITIVE_LITERAL_HASHES:
        for index in range(len(normalized) - length + 1):
            candidate = normalized[index:index + length]
            if hashlib.sha256(candidate.encode()).hexdigest() == expected_hash:
                return True
    return False


def public_files():
    result = subprocess.run(
        ["git", "ls-files", "-co", "--exclude-standard", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [ROOT / item.decode() for item in result.stdout.split(b"\0") if item]


class PackageTest(unittest.TestCase):
    def test_host_adapters_resolve(self):
        for path in [
            ROOT / ".claude/skills/create-faceless-channel",
            ROOT / "skills/create-faceless-channel",
        ]:
            self.assertTrue(path.is_symlink(), path)
            self.assertTrue(path.resolve().is_dir(), path)

    def test_plugin_manifests(self):
        plugin = json.loads((ROOT / ".claude-plugin/plugin.json").read_text())
        marketplace = json.loads((ROOT / ".claude-plugin/marketplace.json").read_text())
        self.assertEqual(plugin["name"], "faceless-channel-factory")
        self.assertEqual(marketplace["plugins"][0]["name"], plugin["name"])
        self.assertEqual(marketplace["plugins"][0]["source"], ".")

    def test_agent_eval_bank_declares_its_execution_status(self):
        manifest = json.loads((ROOT / ".agents/skills/create-faceless-channel/evals/evals.json").read_text())
        self.assertEqual(manifest["executionStatus"], "specification")

    def test_github_actions_use_full_commit_shas(self):
        failures = []
        for path in (ROOT / ".github/workflows").glob("*.yml"):
            for reference in ACTION_REFERENCE.findall(path.read_text(encoding="utf-8")):
                if not re.fullmatch(r"[0-9a-f]{40}", reference):
                    failures.append(f"{path.name}: {reference}")
        self.assertEqual(failures, [])

    def test_relative_markdown_links_resolve(self):
        failures = []
        for path in public_files():
            if path.suffix != ".md" or not path.is_file():
                continue
            for target in MARKDOWN_LINK.findall(path.read_text(encoding="utf-8")):
                clean = target.strip().strip("<>").split("#", 1)[0]
                if not clean or "://" in clean or clean.startswith(("#", "mailto:")):
                    continue
                if not (path.parent / clean).resolve().exists():
                    failures.append(f"{path.relative_to(ROOT)} -> {target}")
        self.assertEqual(failures, [])

    def test_public_package_excludes_blocked_text_identifiers(self):
        failures = []
        for path in public_files():
            if not path.is_file() or path.suffix.lower() in IMAGE_SUFFIXES | {".mp4"}:
                continue
            relative = str(path.relative_to(ROOT))
            if contains_sensitive_literal(relative) or SENSITIVE_IDENTIFIER.search(relative):
                failures.append(f"{relative} (path)")
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if contains_sensitive_literal(text) or SENSITIVE_IDENTIFIER.search(text):
                failures.append(relative)
        self.assertEqual(failures, [])

    def test_image_assets_have_an_explicit_privacy_decision(self):
        images = {
            str(path.relative_to(ROOT))
            for path in public_files()
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
        }
        self.assertEqual(images, set(IMAGE_PRIVACY_ALLOWLIST))

    def test_image_assets_exclude_embedded_text_and_exif_metadata(self):
        failures = []
        for relative in IMAGE_PRIVACY_ALLOWLIST:
            path = ROOT / relative
            data = path.read_bytes()
            if path.suffix.lower() == ".png":
                forbidden = {b"eXIf", b"iTXt", b"tEXt", b"zTXt"}
                offset = 8
                while offset + 12 <= len(data):
                    length = int.from_bytes(data[offset:offset + 4], "big")
                    chunk_type = data[offset + 4:offset + 8]
                    if chunk_type in forbidden:
                        failures.append(f"{relative}: {chunk_type.decode()}")
                    offset += 12 + length
            elif b"Exif\x00\x00" in data or b"http://ns.adobe.com/xap/1.0/" in data:
                failures.append(f"{relative}: JPEG metadata")
        self.assertEqual(failures, [])


if __name__ == "__main__":
    unittest.main()
