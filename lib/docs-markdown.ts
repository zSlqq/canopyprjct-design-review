import type {
    Element,
    Root,
} from "hast";
import type {
    Plugin,
} from "unified";
import {
    visit,
} from "unist-util-visit";

const headingNames =
    new Set([
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
    ]);

export function documentationAnchorPlugin(
    anchors: string[],
): Plugin<[], Root> {
    return function attachDocumentationAnchors() {
        return function transform(
            tree,
        ) {
            let headingIndex = 0;

            visit(
                tree,
                "element",
                (node: Element) => {
                    if (
                        !headingNames.has(
                            node.tagName,
                        )
                    ) {
                        return;
                    }

                    const anchor =
                        anchors[
                            headingIndex
                        ];

                    headingIndex += 1;

                    if (!anchor) {
                        return;
                    }

                    node.properties ??= {};
                    node.properties.id =
                        anchor;
                },
            );
        };
    };
}
