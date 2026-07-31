#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json

from pathlib import Path
from typing import Any


def read_json(
    path: Path,
) -> Any:
    return json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )


def resolve_avatar(
    media_root: Path,
    avatar: str,
) -> Path:
    prefix = (
        "/_archive-media/contributors/"
    )

    if not avatar.startswith(
        prefix
    ):
        raise ValueError(
            f"Unexpected local avatar path: {avatar}"
        )

    relative = avatar[
        len(
            prefix
        ):
    ]

    if (
        not relative
        or "/"
        in relative
        or "\\"
        in relative
    ):
        raise ValueError(
            f"Unsafe local avatar path: {avatar}"
        )

    return (
        media_root
        / relative
    )


def verify(
    archive_root: Path,
    media_root: Path,
) -> dict[str, Any]:
    manifest_path = (
        archive_root
        / "manifest.json"
    )

    if not manifest_path.is_file():
        return {
            "archiveRoot":
                str(
                    archive_root
                ),
            "mediaRoot":
                str(
                    media_root
                ),
            "projects":
                0,
            "avatarReferences":
                0,
            "uniqueAvatarAssets":
                0,
            "missingProjects": [
                str(
                    manifest_path
                )
            ],
            "missingAvatars": [],
            "unsafeAvatarPaths": [],
            "passed":
                False,
        }

    manifest = read_json(
        manifest_path
    )

    missing_projects = []
    missing_avatars = []
    unsafe_paths = []
    avatar_references = []
    projects = manifest.get(
        "projects",
        [],
    )

    for summary in projects:
        project_file = (
            archive_root
            / str(
                summary.get(
                    "file",
                    ""
                )
            )
        )

        if not project_file.is_file():
            missing_projects.append(
                str(
                    project_file
                )
            )

            continue

        project = read_json(
            project_file
        )

        for contributor in project.get(
            "contributors",
            [],
        ):
            avatar = str(
                contributor.get(
                    "avatar"
                )
                or ""
            ).strip()

            if not avatar:
                continue

            avatar_references.append(
                avatar
            )

            try:
                destination = resolve_avatar(
                    media_root,
                    avatar,
                )
            except ValueError:
                unsafe_paths.append(
                    avatar
                )

                continue

            if (
                not destination.is_file()
                or destination.stat().st_size
                <= 32
            ):
                missing_avatars.append(
                    str(
                        destination
                    )
                )

    unique_avatars = sorted(
        set(
            avatar_references
        )
    )

    result = {
        "archiveRoot":
            str(
                archive_root
            ),
        "mediaRoot":
            str(
                media_root
            ),
        "projects":
            len(
                projects
            ),
        "avatarReferences":
            len(
                avatar_references
            ),
        "uniqueAvatarAssets":
            len(
                unique_avatars
            ),
        "missingProjects":
            missing_projects,
        "missingAvatars":
            sorted(
                set(
                    missing_avatars
                )
            ),
        "unsafeAvatarPaths":
            sorted(
                set(
                    unsafe_paths
                )
            ),
        "passed":
            bool(
                manifest.get(
                    "passed"
                )
                and len(
                    projects
                )
                == 15
                and len(
                    avatar_references
                )
                > 0
                and not missing_projects
                and not missing_avatars
                and not unsafe_paths
            ),
    }

    return result


def main() -> None:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--archive-root",
        type=Path,
        required=True,
    )

    parser.add_argument(
        "--media-root",
        type=Path,
        required=True,
    )

    parser.add_argument(
        "--report",
        type=Path,
    )

    arguments = parser.parse_args()

    result = verify(
        arguments.archive_root,
        arguments.media_root,
    )

    output = (
        json.dumps(
            result,
            indent=2,
        )
        + "\n"
    )

    print(
        output,
        end="",
    )

    if arguments.report:
        arguments.report.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        arguments.report.write_text(
            output,
            encoding="utf-8",
        )

    if not result[
        "passed"
    ]:
        raise SystemExit(
            "Archive contributor-media integrity failed."
        )


if __name__ == "__main__":
    main()
