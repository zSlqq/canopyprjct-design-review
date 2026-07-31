#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path.cwd()
DOCS_MANIFEST = ROOT / "lib/data/generated/docs/index-manifest.json"
PUBLIC_DOCS_MANIFEST = ROOT / "public/_docs-index/manifest.json"
GENERATED = ROOT / "lib/data/generated/features"
PUBLIC = ROOT / "public/_feature-library"
GENERATED_MANIFEST = GENERATED / "manifest.json"
PUBLIC_MANIFEST = PUBLIC / "manifest.json"
VERIFY_REPORT = GENERATED / "verification.json"

GENERIC = {
    "", "-", "--", "/", "//", "api", "command", "commands",
    "configuration", "default", "default value", "description",
    "details", "example", "examples", "feature", "features",
    "guide", "introduction", "notes", "options", "overview",
    "parameter", "parameters", "reference", "requirements",
    "return", "return value", "returns", "setting", "settings",
    "setup", "suggested option", "suggested options", "syntax",
    "type", "usage", "usage details", "value", "values",
}

KIND_ORDER = [
    "command", "extension", "rule", "api", "installation",
    "configuration", "model", "event", "guide", "reference", "feature",
]

def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))

def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", str(value or ""))
    value = "".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()

def clean(value: str) -> str:
    value = re.sub(r"`+", "", str(value or ""))
    value = re.sub(r"^\s*#+\s*", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value.strip(" \t\r\n-|:;,.<>[]{}()")

def humanize(value: str) -> str:
    value = re.sub(r"https?://\S+", " ", str(value or ""))
    value = value.split("#", 1)[0].strip(" /\\")
    if "/" in value:
        value = value.rsplit("/", 1)[-1]
    value = re.sub(r"\.[A-Za-z0-9]+$", "", value)
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", value)
    value = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", value)
    value = re.sub(r"[-_.:]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    if not value:
        return ""
    acronyms = {"api", "cli", "http", "https", "id", "json", "mc", "npm", "ui", "url"}
    out = []
    for word in value.split():
        lower = word.lower()
        out.append(lower.upper() if lower in acronyms else word[:1].upper() + word[1:])
    return " ".join(out)

def meaningful(value: str) -> bool:
    value = clean(value)
    return bool(value and normalize(value) not in GENERIC and re.search(r"[A-Za-z0-9]", value))

def nearest_context(entry: dict[str, Any]) -> str:
    current = normalize(str(entry.get("sectionTitle", "")))
    document = normalize(str(entry.get("documentTitle", "")))
    headings = [clean(str(v)) for v in entry.get("headingPath", [])]
    for heading in reversed(headings):
        if meaningful(heading) and normalize(heading) not in {current, document}:
            return heading
    route = str(entry.get("route", "")).split("#", 1)[0]
    candidate = humanize(route)
    if meaningful(candidate):
        return candidate
    document_title = clean(str(entry.get("documentTitle", "")))
    if meaningful(document_title):
        return document_title
    return humanize(str(entry.get("repository", "")))

def code_identity(text: str) -> str:
    lines = [line.strip() for line in str(text or "").splitlines() if line.strip()]
    for line in lines[:24]:
        if line.startswith(("#", ">", "```")):
            continue
        line = re.sub(r"^(?://+|/\*+|\*+|\$)\s*", "", line).strip()
        command = re.search(r"(?<!\w)(/[A-Za-z0-9:_-]+(?:\s+[A-Za-z0-9:_<>{}\[\].+-]+){0,3})", line)
        if command:
            return humanize(command.group(1))
        call = re.search(r"\b([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)?)\s*\(", line)
        if call:
            return humanize(call.group(1))
        declaration = re.search(r"\b(?:const|let|var|class|interface|type|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)", line)
        if declaration:
            return humanize(declaration.group(1))
    return ""

def canonical_title(entry: dict[str, Any]) -> str:
    original = clean(str(entry.get("sectionTitle", "")))
    normalized_original = normalize(original)
    context = nearest_context(entry)

    if normalized_original in GENERIC or not meaningful(original) or len(original) <= 2:
        identity = code_identity(str(entry.get("text", "")))
        base = identity if meaningful(identity) else context
        detail = humanize(original)
        if detail and normalize(detail) not in {normalize(base), "overview", "details"}:
            title = f"{base} — {detail}" if base else detail
        else:
            title = base
    else:
        title = original
        if normalized_original in {
            "default value", "suggested options", "type", "value",
            "examples", "parameters", "return value",
        } and meaningful(context) and normalize(context) != normalized_original:
            title = f"{context} — {humanize(original)}"

    title = re.sub(r"\s+", " ", title or "").strip(" \t\r\n-|:;,.<>[]{}()")
    if not meaningful(title):
        title = code_identity(str(entry.get("text", ""))) or context or humanize(str(entry.get("repository", ""))) or "Documented Feature"
    title = humanize(title)
    return title if len(title) <= 112 else title[:109].rstrip() + "…"

def classify(entry: dict[str, Any], title: str) -> str:
    combined = normalize(" ".join([
        title,
        str(entry.get("sectionTitle", "")),
        str(entry.get("documentTitle", "")),
        " ".join(str(v) for v in entry.get("headingPath", [])),
        str(entry.get("searchText", ""))[:900],
    ]))
    route = str(entry.get("route", "")).lower()
    padded = f" {combined} "
    checks = [
        ("command", (" command ", " commands ", " slash command ", " cli ", "/commands")),
        ("extension", (" extension ", " extensions ", " plugin ", " add on ", " addon ")),
        ("rule", (" rule ", " rules ", " infodisplay ", " display rule ")),
        ("api", (" api ", " endpoint ", " endpoints ", " interface ", " calling an api ")),
        ("installation", (" install ", " installation ", " update ", " updates ", " setup ", " getting started ")),
        ("configuration", (" config ", " configuration ", " setting ", " settings ", " option ", " options ", " default value ")),
        ("model", (" model ", " models ", " data model ", " schema ", " type ")),
        ("event", (" event ", " listener ", " signal ", " hook ")),
        ("guide", (" guide ", " movement ", " advanced ", " cosmetic ", " clipping ", " method ", " tutorial ")),
        ("reference", (" reference ", " glossary ", " terms ", " patched ", " changelog ")),
    ]
    for kind, keywords in checks:
        if any((keyword in route) if keyword.startswith("/") else (keyword in padded) for keyword in keywords):
            return kind
    return "feature"

def snippet(value: str) -> str:
    value = re.sub(r"```.*?```", " ", str(value or ""), flags=re.DOTALL)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", value)
    value = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"^\s*#+\s*", "", value, flags=re.MULTILINE)
    value = re.sub(r"\s+", " ", value).strip()
    return value if len(value) <= 330 else value[:327].rstrip() + "…"

def syntax(text: str) -> str:
    lines = [line.rstrip() for line in str(text or "").splitlines()]
    in_code = False
    code_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            continue
        if in_code and stripped:
            code_lines.append(stripped)
    candidates = code_lines or [line.strip() for line in lines if line.strip()]
    for line in candidates[:30]:
        if line in {"//", "#", "-"}:
            continue
        if line.startswith(("/", "$ ", "npm ", "npx ", "pnpm ", "yarn ", "import ", "export ", "const ", "let ", "class ", "function ")):
            return line[:180].rstrip()
    return ""

def record(entry: dict[str, Any]) -> dict[str, Any]:
    title = canonical_title(entry)
    original = clean(str(entry.get("sectionTitle", "")))
    headings = [clean(str(v)) for v in entry.get("headingPath", []) if clean(str(v))]
    aliases: list[str] = []
    for value in [original, str(entry.get("documentTitle", "")), *headings]:
        value = clean(value)
        if value and normalize(value) != normalize(title) and value not in aliases:
            aliases.append(value)
    return {
        "id": str(entry.get("id", "")),
        "documentId": str(entry.get("documentId", "")),
        "projectId": str(entry.get("projectId", "")),
        "projectTitle": str(entry.get("projectTitle", "")),
        "repository": str(entry.get("repository", "")),
        "kind": classify(entry, title),
        "title": title,
        "originalTitle": original,
        "route": str(entry.get("route", "")),
        "sourceUrl": str(entry.get("sourceUrl", "")),
        "sourceType": str(entry.get("sourceType", "repository")),
        "documentTitle": str(entry.get("documentTitle", "")),
        "sectionTitle": original,
        "headingPath": headings,
        "snippet": snippet(str(entry.get("text", "") or entry.get("searchText", ""))),
        "syntax": syntax(str(entry.get("text", ""))),
        "aliases": aliases[:8],
    }

def main() -> None:
    generated = load(DOCS_MANIFEST)
    public = load(PUBLIC_DOCS_MANIFEST)
    if generated != public:
        raise RuntimeError("Documentation search manifests do not match.")

    projects = generated.get("projects", [])
    if not projects:
        raise RuntimeError("Documentation search has no projects.")

    GENERATED.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for existing in PUBLIC.glob("*.json"):
        existing.unlink()

    by_project: dict[str, list[dict[str, Any]]] = defaultdict(list)
    seen: set[str] = set()
    source_entries = 0

    for project in projects:
        shard = load(ROOT / "public" / str(project["file"]).lstrip("/"))
        for entry in shard.get("entries", []):
            source_entries += 1
            item = record(entry)
            if not item["id"] or item["id"] in seen:
                raise RuntimeError(f"Missing or duplicate feature ID: {item['id']}")
            seen.add(item["id"])
            by_project[item["projectId"]].append(item)

    manifest_projects = []
    spotlight = []
    generic_failures = []
    punctuation_failures = []
    repeated = []
    title_counts: Counter[tuple[str, str]] = Counter()
    total_bytes = 0

    for project in projects:
        project_id = str(project["projectId"])
        items = sorted(
            by_project[project_id],
            key=lambda item: (
                KIND_ORDER.index(item["kind"]) if item["kind"] in KIND_ORDER else 999,
                normalize(item["title"]), item["route"], item["id"],
            ),
        )
        kinds = Counter(item["kind"] for item in items)

        for item in items:
            normalized_title = normalize(item["title"])
            title_counts[(project_id, normalized_title)] += 1
            if normalized_title in GENERIC:
                generic_failures.append({"id": item["id"], "title": item["title"]})
            if not re.search(r"[A-Za-z0-9]", item["title"]):
                punctuation_failures.append({"id": item["id"], "title": item["title"]})

        payload = {
            "schemaVersion": 1,
            "projectId": project_id,
            "projectTitle": str(project.get("projectTitle", project_id)),
            "repository": str(items[0]["repository"] if items else project_id),
            "entries": items,
        }
        serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        filename = f"{project_id}.{digest[:16]}.json"
        destination = PUBLIC / filename
        destination.write_text(serialized, encoding="utf-8")
        size = destination.stat().st_size
        total_bytes += size

        spotlight.extend(sorted(
            items,
            key=lambda item: (
                0 if item["kind"] in {"command", "extension", "api", "rule"} else 1,
                len(item["title"]), item["title"],
            ),
        )[:2])

        manifest_projects.append({
            "projectId": project_id,
            "projectTitle": str(project.get("projectTitle", project_id)),
            "repository": str(items[0]["repository"] if items else project_id),
            "file": f"/_feature-library/{filename}",
            "hash": digest[:16],
            "entries": len(items),
            "bytes": size,
            "kinds": dict(sorted(kinds.items())),
        })

    for (project_id, title), count in title_counts.items():
        if count > 12:
            repeated.append({"projectId": project_id, "title": title, "count": count})

    manifest = {
        "schemaVersion": 1,
        "generatedAt": generated.get("generatedAt"),
        "projects": manifest_projects,
        "kinds": KIND_ORDER,
        "totalEntries": source_entries,
        "totalBytes": total_bytes,
        "spotlight": spotlight,
    }
    verification = {
        "schemaVersion": 1,
        "projects": len(manifest_projects),
        "sourceEntries": int(generated.get("totalEntries", 0)),
        "featureEntries": source_entries,
        "featureBytes": total_bytes,
        "genericTitleFailures": generic_failures,
        "punctuationTitleFailures": punctuation_failures,
        "excessiveRepeatedTitles": repeated,
        "allProjectsCovered": len(manifest_projects) == len(projects),
        "allSearchEntriesCovered": source_entries == int(generated.get("totalEntries", 0)),
    }
    verification["passed"] = all([
        verification["allProjectsCovered"],
        verification["allSearchEntriesCovered"],
        not generic_failures,
        not punctuation_failures,
        not repeated,
    ])

    text = json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    GENERATED_MANIFEST.write_text(text, encoding="utf-8")
    PUBLIC_MANIFEST.write_text(text, encoding="utf-8")
    VERIFY_REPORT.write_text(json.dumps(verification, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(verification, indent=2, ensure_ascii=False))

    if not verification["passed"]:
        raise RuntimeError("Feature library verification failed.")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Feature library generation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
