#!/usr/bin/env python3
"""Validate the portable skill package without third-party dependencies."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
PORTABLE_FIELDS = {
    "name",
    "description",
    "license",
    "compatibility",
    "metadata",
    "allowed-tools",
}


def parse_frontmatter(text: str) -> tuple[dict[str, str], str, list[str]]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text, ["SKILL.md must start with YAML frontmatter"]
    try:
        end = next(index for index in range(1, len(lines)) if lines[index].strip() == "---")
    except StopIteration:
        return {}, text, ["SKILL.md frontmatter is not closed"]

    fields: dict[str, str] = {}
    errors: list[str] = []
    for line in lines[1:end]:
        if not line or line[0].isspace() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            errors.append(f"invalid frontmatter line: {line}")
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip().strip('"').strip("'")
    return fields, "\n".join(lines[end + 1 :]).strip(), errors


def validate(skill: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    source = skill / "SKILL.md"
    if not source.is_file():
        return [f"missing {source}"], []

    text = source.read_text(encoding="utf-8")
    fields, body, parse_errors = parse_frontmatter(text)
    errors.extend(parse_errors)
    name = fields.get("name", "")
    description = fields.get("description", "")

    if not NAME_RE.fullmatch(name) or name != skill.name or len(name) > 64:
        errors.append("frontmatter name must match the skill folder and use lowercase kebab-case")
    if not description or len(description) > 1024:
        errors.append("frontmatter description must contain 1 to 1024 characters")
    elif not re.search(r"\b(use|when|asks?|needs?)\b", description, re.I):
        warnings.append("description should state when the skill activates")
    unknown = sorted(set(fields) - PORTABLE_FIELDS)
    if unknown:
        errors.append(f"non-portable frontmatter fields: {', '.join(unknown)}")
    if not body:
        errors.append("SKILL.md needs an instruction body")
    if len(text.splitlines()) > 500:
        warnings.append("SKILL.md exceeds 500 lines")

    for match in LINK_RE.finditer(text):
        target = match.group(1).strip().strip("<>").split("#", 1)[0]
        if not target or "://" in target or target.startswith(("#", "mailto:")):
            continue
        resolved = (skill / target).resolve()
        try:
            resolved.relative_to(skill.resolve())
        except ValueError:
            warnings.append(f"link leaves skill directory: {target}")
            continue
        if not resolved.exists():
            errors.append(f"linked resource does not exist: {target}")

    if (skill / "README.md").exists():
        warnings.append("keep human README files outside the installable skill folder")

    eval_file = skill / "evals" / "evals.json"
    if not eval_file.is_file():
        errors.append("missing evals/evals.json")
    else:
        try:
            manifest = json.loads(eval_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            errors.append(f"invalid eval JSON: {error}")
        else:
            if manifest.get("skill") != name:
                errors.append("eval manifest skill must match frontmatter name")
            if manifest.get("executionStatus") != "specification":
                errors.append("eval manifest must declare executionStatus as specification until a host-backed runner executes it")
            cases = manifest.get("cases")
            if not isinstance(cases, list) or not cases:
                errors.append("eval manifest needs a non-empty cases list")
            else:
                ids: set[str] = set()
                for case in cases:
                    if not isinstance(case, dict):
                        errors.append("every eval case must be an object")
                        continue
                    case_id = case.get("id")
                    kind = case.get("kind")
                    if not isinstance(case_id, str) or not case_id:
                        errors.append("every eval case needs a non-empty id")
                    elif case_id in ids:
                        errors.append(f"duplicate eval id: {case_id}")
                    else:
                        ids.add(case_id)
                    if kind not in {"routing", "functional", "failure"}:
                        errors.append(f"eval {case_id or '<unknown>'} has invalid kind")
                    if not isinstance(case.get("prompt"), str) or not case["prompt"].strip():
                        errors.append(f"eval {case_id or '<unknown>'} needs a prompt")
                    if kind == "routing" and not isinstance(case.get("expect_activation"), bool):
                        errors.append(f"routing eval {case_id} needs expect_activation")
                    if kind in {"functional", "failure"}:
                        assertions = case.get("assertions")
                        if not isinstance(assertions, list) or not assertions:
                            errors.append(f"eval {case_id} needs assertions")

    for placeholder in ("[TODO", "{{NAME}}", "{{DESCRIPTION}}"):
        if placeholder in text:
            errors.append(f"unfinished placeholder: {placeholder}")
    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skill_directory", type=Path)
    parser.add_argument("--strict", action="store_true", help="treat warnings as failures")
    arguments = parser.parse_args()
    skill = arguments.skill_directory.expanduser().resolve()
    errors, warnings = validate(skill)
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    print(f"{skill}: {len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors or (arguments.strict and warnings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
