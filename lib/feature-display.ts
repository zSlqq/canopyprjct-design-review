type UnknownRecord =
    Record<
        string,
        unknown
    >;

const genericPhrases =
    new Set([
        "",
        "-",
        "--",
        "/",
        "//",
        "command",
        "commands",
        "configuration",
        "default",
        "default value",
        "description",
        "details",
        "example",
        "examples",
        "feature",
        "features",
        "function",
        "functions",
        "global rule",
        "global rules",
        "note",
        "notes",
        "option",
        "options",
        "overview",
        "parameter",
        "parameters",
        "quick example",
        "return",
        "return value",
        "returns",
        "rule",
        "rules",
        "setting",
        "settings",
        "suggested option",
        "suggested options",
        "syntax",
        "type",
        "usage",
        "usage details",
        "value",
        "values",
    ]);

const kindLabels:
    Record<
        string,
        string
    > = {
        api:
            "API",
        command:
            "Command",
        configuration:
            "Setting",
        event:
            "Event",
        extension:
            "Extension",
        feature:
            "Feature",
        function:
            "Function",
        guide:
            "Guide",
        installation:
            "Installation",
        method:
            "Method",
        model:
            "Model",
        reference:
            "Reference",
        rule:
            "Rule",
    };

function record(
    value:
        unknown,
): UnknownRecord {
    return (
        value
        && typeof value
            === "object"
        && !Array.isArray(
            value,
        )
    )
        ? value as UnknownRecord
        : {};
}

function text(
    value:
        unknown,
): string {
    if (
        typeof value
        === "string"
    ) {
        return value;
    }

    if (
        typeof value
        === "number"
        || typeof value
            === "boolean"
    ) {
        return String(
            value,
        );
    }

    return "";
}

function textList(
    value:
        unknown,
): string[] {
    if (
        Array.isArray(
            value,
        )
    ) {
        return value
            .map(
                text,
            )
            .filter(
                Boolean,
            );
    }

    const single =
        text(
            value,
        );

    if (!single) {
        return [];
    }

    return single
        .split(
            /[\n,|]+/,
        )
        .map(
            (
                item,
            ) =>
                item.trim(),
        )
        .filter(
            Boolean,
        );
}

function splitWords(
    value:
        unknown,
): string {
    return text(
        value,
    )
        .replace(
            /([a-z0-9])([A-Z])/g,
            "$1 $2",
        )
        .replace(
            /([A-Z]+)([A-Z][a-z])/g,
            "$1 $2",
        )
        .replace(
            /\b(default)(value)\b/gi,
            "$1 $2",
        )
        .replace(
            /\b(quick)(example)\b/gi,
            "$1 $2",
        );
}

function normalized(
    value:
        unknown,
): string {
    return splitWords(
        value,
    )
        .normalize(
            "NFKD",
        )
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " ",
        )
        .trim();
}

function stripped(
    value:
        unknown,
): string {
    return splitWords(
        value,
    )
        .replace(
            /```[\s\S]*?```/g,
            " ",
        )
        .replace(
            /!\[[^\]]*\]\([^)]+\)/g,
            " ",
        )
        .replace(
            /\[([^\]]+)\]\([^)]+\)/g,
            "$1",
        )
        .replace(
            /<[^>]+>/g,
            " ",
        )
        .replace(
            /[`*_~>#|]/g,
            " ",
        )
        .replace(
            /\s+/g,
            " ",
        )
        .trim();
}

function humanized(
    value:
        unknown,
): string {
    const raw =
        stripped(
            value,
        )
            .replace(
                /https?:\/\/\S+/g,
                " ",
            )
            .split(
                "#",
                1,
            )[
                0
            ]
            .replace(
                /^.*[\\/]/,
                "",
            )
            .replace(
                /\.[A-Za-z0-9]+$/,
                "",
            )
            .replace(
                /[-_.:]+/g,
                " ",
            )
            .replace(
                /\s+/g,
                " ",
            )
            .trim();

    if (!raw) {
        return "";
    }

    const acronyms =
        new Set([
            "api",
            "cli",
            "http",
            "https",
            "id",
            "json",
            "mc",
            "npm",
            "ui",
            "url",
        ]);

    return raw
        .split(
            " ",
        )
        .map(
            (
                word,
            ) => {
                const lowered =
                    word.toLowerCase();

                return acronyms.has(
                    lowered,
                )
                    ? lowered.toUpperCase()
                    : (
                        word.charAt(
                            0,
                        ).toUpperCase()
                        + word.slice(
                            1,
                        )
                    );
            },
        )
        .join(
            " ",
        );
}

function meaningful(
    value:
        unknown,
): string {
    const candidate =
        humanized(
            value,
        );

    if (
        candidate.length
        <= 2
        || genericPhrases.has(
            normalized(
                candidate,
            ),
        )
    ) {
        return "";
    }

    return candidate;
}

function originalTitle(
    value:
        unknown,
): string {
    const output:
        string[] = [];

    for (
        const segment
        of text(
            value,
        )
            .replace(
                /`+/g,
                "",
            )
            .split(
                /\s+[—–]\s+|\s+-\s+/,
            )
    ) {
        const candidate =
            meaningful(
                segment,
            );

        if (!candidate) {
            continue;
        }

        const key =
            normalized(
                candidate,
            );

        if (
            genericPhrases.has(
                key,
            )
            || output.some(
                (
                    existing,
                ) =>
                    normalized(
                        existing,
                    )
                    === key,
            )
        ) {
            continue;
        }

        output.push(
            candidate,
        );
    }

    return output.join(
        " — ",
    );
}

function syntaxIdentity(
    value:
        unknown,
): string {
    for (
        const line
        of text(
            value,
        )
            .split(
                /\r?\n/,
            )
            .map(
                (
                    item,
                ) =>
                    item.trim(),
            )
            .filter(
                Boolean,
            )
    ) {
        const command =
            line.match(
                /(?<!\w)(\/[A-Za-z0-9:_-]+)/,
            );

        if (command) {
            return meaningful(
                command[
                    1
                ],
            );
        }

        const declaration =
            line.match(
                /\b(?:class|const|def|function|interface|let|type|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
            );

        if (declaration) {
            return meaningful(
                declaration[
                    1
                ],
            );
        }

        const call =
            line.match(
                /\b([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)?)\s*\(/,
            );

        if (call) {
            return meaningful(
                call[
                    1
                ],
            );
        }
    }

    return "";
}

function proseIdentity(
    value:
        unknown,
): string {
    const source =
        stripped(
            value,
        );

    if (!source) {
        return "";
    }

    const command =
        source.match(
            /(?<!\w)(\/[A-Za-z0-9:_-]+)/,
        );

    if (command) {
        return meaningful(
            command[
                1
            ],
        );
    }

    const phrase =
        source
            .split(
                /[.!?;]\s+/,
                1,
            )[
                0
            ]
            .split(
                /\s+/,
            )
            .slice(
                0,
                8,
            )
            .join(
                " ",
            );

    return (
        phrase.length
        >= 4
        && phrase.length
            <= 78
    )
        ? meaningful(
            phrase,
        )
        : "";
}

export function canonicalFeatureTitle(
    input:
        unknown,
): string {
    const feature =
        record(
            input,
        );

    const usage =
        record(
            feature.usage,
        );

    const source =
        record(
            feature.source,
        );

    const original =
        originalTitle(
            feature.title,
        );

    if (
        original
        && !genericPhrases.has(
            normalized(
                original,
            ),
        )
    ) {
        return original;
    }

    const candidates = [
        syntaxIdentity(
            feature.syntax,
        ),
        syntaxIdentity(
            usage.syntax,
        ),
        ...textList(
            feature.aliases,
        ).map(
            meaningful,
        ),
        meaningful(
            source.section,
        ),
        ...textList(
            feature.headingPath,
        )
            .slice()
            .reverse()
            .map(
                meaningful,
            ),
        meaningful(
            feature.documentTitle,
        ),
        proseIdentity(
            feature.snippet,
        ),
        proseIdentity(
            usage.summary,
        ),
        proseIdentity(
            source.excerpt,
        ),
    ].filter(
        Boolean,
    );

    const contextual =
        candidates.find(
            (
                candidate,
            ) =>
                !genericPhrases.has(
                    normalized(
                        candidate,
                    ),
                ),
        )
        ?? "";

    if (contextual) {
        return contextual;
    }

    const repository =
        meaningful(
            feature.projectTitle,
        )
        || meaningful(
            feature.repository,
        );

    const kind =
        kindLabels[
            normalized(
                feature.kind,
            )
        ]
        ?? "Feature";

    return repository
        ? `${repository} ${kind}`
        : `Documented ${kind}`;
}
