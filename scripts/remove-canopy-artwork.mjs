
import {
    createRequire,
} from "node:module";

import {
    existsSync,
    readFileSync,
    readdirSync,
    writeFileSync,
} from "node:fs";

import {
    extname,
    join,
    relative,
    resolve,
} from "node:path";

const require =
    createRequire(
        import.meta.url,
    );

const ts =
    require(
        "typescript",
    );

const root =
    resolve(
        process.argv[
            2
        ]
        ?? process.cwd(),
    );

const reportPath =
    resolve(
        process.argv[
            3
        ]
        ?? join(
            root,
            ".stage33/canopy-artwork-patch.json",
        ),
    );

const markers = [
    "canopy-banner",
    "6170169d0da576b8e6cfa262",
];

const sourceRoots = [
    "app",
    "components",
    "lib",
];

const extensions =
    new Set([
        ".js",
        ".jsx",
        ".json",
        ".css",
        ".scss",
        ".ts",
        ".tsx",
    ]);

function markerIn(
    value,
) {
    const prepared =
        String(
            value
            ?? "",
        ).toLowerCase();

    return markers.some(
        (
            marker,
        ) =>
            prepared.includes(
                marker,
            ),
    );
}

function filesUnder(
    directory,
) {
    if (
        !existsSync(
            directory,
        )
    ) {
        return [];
    }

    const output = [];

    for (
        const entry
        of readdirSync(
            directory,
            {
                withFileTypes:
                    true,
            },
        )
    ) {
        if (
            entry.name.startsWith(
                ".",
            )
            || entry.name
                === "node_modules"
            || entry.name
                === "generated"
        ) {
            continue;
        }

        const path =
            join(
                directory,
                entry.name,
            );

        if (
            entry.isDirectory()
        ) {
            output.push(
                ...filesUnder(
                    path,
                ),
            );

            continue;
        }

        if (
            entry.isFile()
            && extensions.has(
                extname(
                    entry.name,
                )
            )
        ) {
            output.push(
                path,
            );
        }
    }

    return output;
}

function scriptKind(
    file,
) {
    switch (
        extname(
            file,
        )
    ) {
        case ".tsx":
            return ts.ScriptKind.TSX;
        case ".jsx":
            return ts.ScriptKind.JSX;
        case ".js":
            return ts.ScriptKind.JS;
        default:
            return ts.ScriptKind.TS;
    }
}

function identifierNames(
    binding,
) {
    if (
        ts.isIdentifier(
            binding,
        )
    ) {
        return [
            binding.text,
        ];
    }

    const output = [];

    for (
        const element
        of binding.elements
    ) {
        if (
            element.dotDotDotToken
        ) {
            continue;
        }

        output.push(
            ...identifierNames(
                element.name,
            ),
        );
    }

    return output;
}


function directBannerValue(
    node,
    bannerIdentifiers,
) {
    return (
        (
            ts.isStringLiteralLike(
                node,
            )
            && markerIn(
                node.text,
            )
        )
        || (
            ts.isIdentifier(
                node,
            )
            && bannerIdentifiers.has(
                node.text,
            )
        )
    );
}

function sourceContainsMarker(
    node,
    sourceFile,
    bannerIdentifiers,
) {
    let found =
        false;

    function inspect(
        current,
    ) {
        if (
            found
        ) {
            return;
        }

        if (
            ts.isStringLiteralLike(
                current,
            )
            && markerIn(
                current.text,
            )
        ) {
            found =
                true;

            return;
        }

        if (
            ts.isIdentifier(
                current,
            )
            && bannerIdentifiers.has(
                current.text,
            )
        ) {
            found =
                true;

            return;
        }

        ts.forEachChild(
            current,
            inspect,
        );
    }

    inspect(
        node,
    );

    return found;
}

function jsxHasBannerSource(
    node,
    sourceFile,
    bannerIdentifiers,
) {
    const attributes =
        node.attributes
            ?.properties
        ?? [];

    for (
        const attribute
        of attributes
    ) {
        if (
            !ts.isJsxAttribute(
                attribute,
            )
            || attribute.name.text
                !== "src"
            || !attribute.initializer
        ) {
            continue;
        }

        if (
            ts.isStringLiteral(
                attribute.initializer,
            )
            && markerIn(
                attribute.initializer.text,
            )
        ) {
            return true;
        }

        if (
            ts.isJsxExpression(
                attribute.initializer,
            )
            && attribute.initializer.expression
            && sourceContainsMarker(
                attribute.initializer.expression,
                sourceFile,
                bannerIdentifiers,
            )
        ) {
            return true;
        }
    }

    return false;
}

function remainingMarkers(
    sourceFile,
) {
    const output = [];

    function inspect(
        node,
    ) {
        if (
            ts.isStringLiteralLike(
                node,
            )
            && markerIn(
                node.text,
            )
        ) {
            output.push({
                kind:
                    ts.SyntaxKind[
                        node.kind
                    ],
                text:
                    node.text,
                position:
                    sourceFile.getLineAndCharacterOfPosition(
                        node.getStart(
                            sourceFile,
                        false,
                    ),
                ),
            });
        }

        ts.forEachChild(
            node,
            inspect,
        );
    }

    inspect(
        sourceFile,
    );

    return output;
}


const removedJson =
    Symbol(
        "removed-json-banner",
    );

function scrubJson(
    value,
) {
    if (
        typeof value
        === "string"
    ) {
        return markerIn(
            value,
        )
            ? removedJson
            : value;
    }

    if (
        Array.isArray(
            value,
        )
    ) {
        return value
            .map(
                scrubJson,
            )
            .filter(
                (
                    item,
                ) =>
                    item
                    !== removedJson,
            );
    }

    if (
        value
        && typeof value
            === "object"
    ) {
        const output = {};

        for (
            const [
                key,
                item,
            ]
            of Object.entries(
                value,
            )
        ) {
            const scrubbed =
                scrubJson(
                    item,
                );

            if (
                scrubbed
                !== removedJson
            ) {
                output[
                    key
                ] = scrubbed;
            }
        }

        return output;
    }

    return value;
}

const files =
    sourceRoots.flatMap(
        (
            directory,
        ) =>
            filesUnder(
                join(
                    root,
                    directory,
                ),
            ),
    );

const changedFiles = [];
const findings = [];

for (
    const file
    of files
) {
    const input =
        readFileSync(
            file,
            "utf8",
        );

    if (
        !markerIn(
            input,
        )
    ) {
        continue;
    }

    if (
        [
            ".css",
            ".scss",
        ].includes(
            extname(
                file,
            ),
        )
    ) {
        const output =
            input.replace(
                /(background(?:-image)?|content)\s*:\s*[^;]*url\([^)]*(?:canopy-banner|6170169d0da576b8e6cfa262)[^)]*\)[^;]*;/gi,
                "$1: none;",
            );

        const unsafeUrl =
            /url\([^)]*(?:canopy-banner|6170169d0da576b8e6cfa262)[^)]*\)/i;

        if (
            unsafeUrl.test(
                output,
            )
        ) {
            findings.push({
                file:
                    relative(
                        root,
                        file,
                    ),
                remaining: [
                    {
                        kind:
                            "CSS_URL",
                        text:
                            "Canopy artwork URL remains.",
                    },
                ],
            });

            continue;
        }

        if (
            output
            !== input
        ) {
            writeFileSync(
                file,
                output,
                "utf8",
            );

            changedFiles.push(
                relative(
                    root,
                    file,
                ),
            );
        }

        continue;
    }

    if (
        extname(
            file,
        )
        === ".json"
    ) {
        const scrubbed =
            scrubJson(
                JSON.parse(
                    input,
                ),
            );

        const output =
            JSON.stringify(
                scrubbed,
                null,
                2,
            )
            + "\n";

        if (
            markerIn(
                output,
            )
        ) {
            findings.push({
                file:
                    relative(
                        root,
                        file,
                    ),
                remaining: [
                    {
                        kind:
                            "JSON",
                        text:
                            "Canopy artwork marker remains.",
                    },
                ],
            });

            continue;
        }

        writeFileSync(
            file,
            output,
            "utf8",
        );

        changedFiles.push(
            relative(
                root,
                file,
            ),
        );

        continue;
    }

    const sourceFile =
        ts.createSourceFile(
            file,
            input,
            ts.ScriptTarget.Latest,
            true,
            scriptKind(
                file,
            ),
        );

    const bannerIdentifiers =
        new Set();

    for (
        const statement
        of sourceFile.statements
    ) {
        if (
            ts.isImportDeclaration(
                statement,
            )
            && ts.isStringLiteral(
                statement.moduleSpecifier,
            )
            && markerIn(
                statement.moduleSpecifier.text,
            )
        ) {
            const clause =
                statement.importClause;

            if (
                clause?.name
            ) {
                bannerIdentifiers.add(
                    clause.name.text,
                );
            }

            for (
                const element
                of clause
                    ?.namedBindings
                    ?.elements
                ?? []
            ) {
                bannerIdentifiers.add(
                    element.name.text,
                );
            }
        }

        if (
            ts.isVariableStatement(
                statement,
            )
        ) {
            for (
                const declaration
                of statement.declarationList.declarations
            ) {
                if (
                    declaration.initializer
                    && directBannerValue(
                        declaration.initializer,
                        bannerIdentifiers,
                    )
                ) {
                    for (
                        const name
                        of identifierNames(
                            declaration.name,
                        )
                    ) {
                        bannerIdentifiers.add(
                            name,
                        );
                    }
                }
            }
        }
    }

    const transformer =
        (
            context,
        ) => {
            const visit =
                (
                    node,
                ) => {
                    if (
                        ts.isImportDeclaration(
                            node,
                        )
                        && ts.isStringLiteral(
                            node.moduleSpecifier,
                        )
                        && markerIn(
                            node.moduleSpecifier.text,
                        )
                    ) {
                        return undefined;
                    }

                    if (
                        ts.isVariableStatement(
                            node,
                        )
                    ) {
                        const declarations =
                            node.declarationList.declarations.filter(
                                (
                                    declaration,
                                ) => {
                                    const names =
                                        identifierNames(
                                            declaration.name,
                                        );

                                    return !names.some(
                                        (
                                            name,
                                        ) =>
                                            bannerIdentifiers.has(
                                                name,
                                            ),
                                    );
                                },
                            );

                        if (
                            declarations.length
                            === 0
                        ) {
                            return undefined;
                        }

                        if (
                            declarations.length
                            !== node.declarationList.declarations.length
                        ) {
                            return ts.factory.updateVariableStatement(
                                node,
                                node.modifiers,
                                ts.factory.updateVariableDeclarationList(
                                    node.declarationList,
                                    declarations,
                                ),
                            );
                        }
                    }

                    if (
                        ts.isCallExpression(
                            node,
                        )
                    ) {
                        const argumentsWithoutArtwork =
                            node.arguments.filter(
                                (
                                    argument,
                                ) =>
                                    !sourceContainsMarker(
                                        argument,
                                        sourceFile,
                                        bannerIdentifiers,
                                    ),
                            );

                        if (
                            argumentsWithoutArtwork.length
                            !== node.arguments.length
                        ) {
                            return ts.visitEachChild(
                                ts.factory.updateCallExpression(
                                    node,
                                    node.expression,
                                    node.typeArguments,
                                    argumentsWithoutArtwork,
                                ),
                                visit,
                                context,
                            );
                        }
                    }

                    if (
                        ts.isNewExpression(
                            node,
                        )
                        && node.arguments
                    ) {
                        const argumentsWithoutArtwork =
                            node.arguments.filter(
                                (
                                    argument,
                                ) =>
                                    !sourceContainsMarker(
                                        argument,
                                        sourceFile,
                                        bannerIdentifiers,
                                    ),
                            );

                        if (
                            argumentsWithoutArtwork.length
                            !== node.arguments.length
                        ) {
                            return ts.visitEachChild(
                                ts.factory.updateNewExpression(
                                    node,
                                    node.expression,
                                    node.typeArguments,
                                    argumentsWithoutArtwork,
                                ),
                                visit,
                                context,
                            );
                        }
                    }

                    if (
                        ts.isObjectLiteralExpression(
                            node,
                        )
                    ) {
                        const properties =
                            node.properties.filter(
                                (
                                    property,
                                ) => {
                                    if (
                                        ts.isPropertyAssignment(
                                            property,
                                        )
                                        && directBannerValue(
                                            property.initializer,
                                            bannerIdentifiers,
                                        )
                                    ) {
                                        return false;
                                    }

                                    if (
                                        ts.isShorthandPropertyAssignment(
                                            property,
                                        )
                                        && bannerIdentifiers.has(
                                            property.name.text,
                                        )
                                    ) {
                                        return false;
                                    }

                                    return true;
                                },
                            );

                        return ts.visitEachChild(
                            ts.factory.updateObjectLiteralExpression(
                                node,
                                properties,
                            ),
                            visit,
                            context,
                        );
                    }

                    if (
                        ts.isArrayLiteralExpression(
                            node,
                        )
                    ) {
                        const elements =
                            node.elements.filter(
                                (
                                    element,
                                ) =>
                                    !directBannerValue(
                                        element,
                                        bannerIdentifiers,
                                    ),
                            );

                        return ts.visitEachChild(
                            ts.factory.updateArrayLiteralExpression(
                                node,
                                elements,
                            ),
                            visit,
                            context,
                        );
                    }

                    if (
                        (
                            ts.isJsxSelfClosingElement(
                                node,
                            )
                            || ts.isJsxElement(
                                node,
                            )
                        )
                        && jsxHasBannerSource(
                            ts.isJsxElement(
                                node,
                            )
                                ? node.openingElement
                                : node,
                            sourceFile,
                            bannerIdentifiers,
                        )
                    ) {
                        if (
                            ts.isJsxElement(
                                node.parent,
                            )
                            || ts.isJsxFragment(
                                node.parent,
                            )
                        ) {
                            return undefined;
                        }

                        return ts.factory.createNull();
                    }

                    return ts.visitEachChild(
                        node,
                        visit,
                        context,
                    );
                };

            return (
                node,
            ) =>
                ts.visitNode(
                    node,
                    visit,
                );
        };

    const transformed =
        ts.transform(
            sourceFile,
            [
                transformer,
            ],
        );

    const printer =
        ts.createPrinter({
            newLine:
                ts.NewLineKind.LineFeed,
        });

    const output =
        printer.printFile(
            transformed.transformed[
                0
            ],
        );

    transformed.dispose();

    const parsedOutput =
        ts.createSourceFile(
            file,
            output,
            ts.ScriptTarget.Latest,
            true,
            scriptKind(
                file,
            ),
        );

    const remaining =
        remainingMarkers(
            parsedOutput,
        );

    if (
        remaining.length
    ) {
        findings.push({
            file:
                relative(
                    root,
                    file,
                ),
            remaining,
        });

        continue;
    }

    if (
        output
        !== input
    ) {
        writeFileSync(
            file,
            output,
            "utf8",
        );

        changedFiles.push(
            relative(
                root,
                file,
            ),
        );
    }
}

if (
    findings.length
) {
    console.error(
        JSON.stringify(
            {
                passed:
                    false,
                findings,
            },
            null,
            2,
        ),
    );

    process.exit(
        1,
    );
}

const result = {
    schemaVersion:
        1,
    scannedFiles:
        files.length,
    changedFiles,
    changed:
        changedFiles.length,
    runtimeMarkerReferences:
        0,
    compatibilityAsset:
        "public/brand/canopy-banner.jpg",
    passed:
        true,
};

writeFileSync(
    reportPath,
    JSON.stringify(
        result,
        null,
        2,
    )
    + "\n",
    "utf8",
);

console.log(
    JSON.stringify(
        result,
        null,
        2,
    ),
);
