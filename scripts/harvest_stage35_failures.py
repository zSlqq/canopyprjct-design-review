#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

TEXT_SUFFIXES = {".json", ".log", ".txt", ".md"}
IGNORED_NAMES = {
    "failure-harvest.json",
    "failure-harvest.log",
}

LOG_SIGNAL_PATTERNS = [
    re.compile(r"^\s*(?:Status:\s*FAIL|STAGE\s+35:\s*FAIL|STAGE\s+35\s+FAILURE)\b", re.I),
    re.compile(r"\bfailed\s+with\s+exit\s+code\s+[1-9]\d*\b", re.I),
    re.compile(r"\b(?:build|verification|validation|audit|generation|installation|startup|restart|clone|download)\s+failed\b", re.I),
    re.compile(r"\bTraceback\s*\(most\s+recent\s+call\s+last\)", re.I),
    re.compile(r"\b(?:Error|Exception):\s+", re.I),
    re.compile(r"\b(?:ENOENT|EACCES|ECONNRESET|ECONNREFUSED|ETIMEDOUT)\b", re.I),
    re.compile(r"\btimed\s+out\b", re.I),
    re.compile(r"\bHTTP\s+Error\s+[45]\d\d\b", re.I),
    re.compile(r"\brate\s+limit\s+exceeded\b", re.I),
    re.compile(r"\bduplicate\s+ids?\b", re.I),
    re.compile(r"\bchecksum\s+mismatch\b", re.I),
    re.compile(r"\bruntime\s+errors?\b", re.I),
    re.compile(r"\bconsole\s+errors?\b", re.I),
    re.compile(r"\bhorizontal\s+overflow\b", re.I),
    re.compile(r"\bvisitor-time\s+GitHub\b", re.I),
    re.compile(r"\bunnamed\s+controls?\b", re.I),
    re.compile(r"\bexceeds?\s+\d+\b", re.I),
]

TOKEN_PATTERNS = [
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}"),
]


def redact(text: str) -> str:
    output = text
    for pattern in TOKEN_PATTERNS:
        output = pattern.sub("[REDACTED_GITHUB_TOKEN]", output)
    return output


def collect_json_failures(value: Any, path: str = "$") -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    if isinstance(value, dict):
        passed = value.get("passed")
        status = value.get("status")
        exit_code = value.get("exitCode")
        failures = value.get("failures")
        errors = value.get("errors")

        if passed is False:
            records.append({"path": path, "kind": "passed-false"})
        if isinstance(status, str) and status.upper() in {"FAIL", "FAILED", "ERROR"}:
            records.append({"path": path, "kind": "status", "value": status})
        if isinstance(exit_code, int) and exit_code != 0:
            records.append({"path": path, "kind": "exit-code", "value": exit_code})
        if isinstance(failures, list) and failures:
            records.append({"path": path, "kind": "failures", "value": failures})
        if isinstance(errors, list) and errors:
            records.append({"path": path, "kind": "errors", "value": errors})

        for key, child in value.items():
            records.extend(collect_json_failures(child, f"{path}.{key}"))

    elif isinstance(value, list):
        for index, child in enumerate(value):
            records.extend(collect_json_failures(child, f"{path}[{index}]"))

    return records


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("report_directory")
    parser.add_argument("--reason", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    report_directory = Path(args.report_directory).resolve()
    output_path = Path(args.output).resolve()

    records: list[dict[str, Any]] = []
    json_failures: list[dict[str, Any]] = []
    signatures: set[str] = set()

    if report_directory.is_dir():
        for file_path in sorted(report_directory.rglob("*")):
            if not file_path.is_file() or file_path.resolve() == output_path:
                continue
            if file_path.name in IGNORED_NAMES:
                continue
            if file_path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            if file_path.stat().st_size > 25_000_000:
                continue

            try:
                text = file_path.read_text(encoding="utf-8-sig", errors="replace")
            except OSError:
                continue

            if file_path.suffix.lower() == ".json":
                try:
                    parsed = json.loads(text)
                except json.JSONDecodeError:
                    parsed = None
                if parsed is not None:
                    failures = collect_json_failures(parsed)
                    if failures:
                        json_failures.append({
                            "file": str(file_path.relative_to(report_directory)),
                            "records": failures,
                        })
                continue

            matches: list[dict[str, Any]] = []
            for line_number, line in enumerate(text.splitlines(), start=1):
                stripped = line.strip()
                if not stripped:
                    continue
                if any(pattern.search(stripped) for pattern in LOG_SIGNAL_PATTERNS):
                    clean = redact(stripped)[:1200]
                    matches.append({"line": line_number, "text": clean})
                    signatures.add(clean)

            if matches:
                records.append({
                    "file": str(file_path.relative_to(report_directory)),
                    "matches": matches,
                })

    report = {
        "schemaVersion": 2,
        "reason": redact(args.reason),
        "reportDirectory": str(report_directory),
        "filesWithFailureSignals": len(records),
        "records": records,
        "jsonFailureObjects": len(json_failures),
        "jsonFailures": json_failures,
        "uniqueSignatures": sorted(signatures),
        "passed": False,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(json.dumps({
        "filesWithFailureSignals": len(records),
        "jsonFailureObjects": len(json_failures),
        "uniqueSignatures": len(signatures),
        "output": str(output_path),
    }, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
