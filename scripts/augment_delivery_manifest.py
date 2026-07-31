#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json

from pathlib import Path


ROOT = Path.cwd()

delivery_path = (
    ROOT
    / "lib/data/generated/docs/delivery-manifest.json"
)

archive_path = (
    ROOT
    / "lib/data/generated/archive/manifest.json"
)

delivery = json.loads(
    delivery_path.read_text(
        encoding="utf-8"
    )
)

archive = json.loads(
    archive_path.read_text(
        encoding="utf-8"
    )
)

routes = set(
    delivery.get("routes", [])
)

routes.add("/archive")
for curated_project in archive.get(
    "projects",
    [],
):
    curated_slug = str(
        curated_project.get(
            "slug",
            "",
        )
    ).strip()

    if curated_slug:
        routes.add(
            f"/projects/{curated_slug}"
        )

routes.add(
    "/archive/search"
)

for project in archive.get(
    "projects",
    [],
):
    routes.add(
        "/archive/"
        + project["slug"]
    )

    function_pages = max(
        1,
        (
            int(
                project.get(
                    "counts",
                    {},
                ).get(
                    "functions",
                    0,
                )
            )
            + 99
        )
        // 100,
    )

    for page in range(
        1,
        function_pages
        + 1,
    ):
        routes.add(
            "/archive/"
            + project["slug"]
            + "/functions/"
            + str(page)
        )

delivery["routes"] = sorted(routes)
delivery.setdefault("summary", {})
delivery["summary"]["routes"] = len(
    delivery["routes"]
)
delivery["summary"]["archiveRepositories"] = (
    archive["summary"]["repositories"]
)
delivery["summary"]["archiveVersions"] = (
    archive["summary"]["versions"]
)
delivery["summary"]["archiveContributors"] = (
    archive["summary"]["contributors"]
)
delivery["summary"]["archiveFunctions"] = (
    archive["summary"]["functions"]
)

delivery.setdefault("checks", {})
delivery["checks"]["archivePassed"] = bool(
    archive.get("passed")
)

delivery["passed"] = bool(
    delivery.get("passed")
    and archive.get("passed")
)

fingerprint_source = json.dumps(
    {
        "routes": delivery["routes"],
        "summary": delivery["summary"],
        "checks": delivery["checks"],
    },
    sort_keys=True,
    separators=(",", ":"),
).encode("utf-8")

delivery["fingerprint"] = hashlib.sha256(
    fingerprint_source
).hexdigest()

delivery_path.write_text(
    json.dumps(
        delivery,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)

print(
    json.dumps(
        {
            "archiveRoutes": (
                archive[
                    "summary"
                ][
                    "repositories"
                ]
                + 2
            ),
            "totalRoutes": len(
                delivery["routes"]
            ),
            "fingerprint": delivery[
                "fingerprint"
            ],
            "passed": delivery["passed"],
        },
        indent=2,
    )
)

if not delivery["passed"]:
    raise SystemExit(
        "Augmented delivery manifest failed."
    )
