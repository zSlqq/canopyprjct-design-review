"use client";

import {
    useMemo,
    useState,
} from "react";

import {
    heroCapabilities,
    type HeroCapabilityId,
} from "@/lib/design/homepage";

import styles from "./ForestHome.module.css";

const labels: Record<
    HeroCapabilityId,
    string
> = {
    world: "Observe live worlds",
    tests: "Automate technical tests",
    builds: "Transfer builds",
    regions: "Edit regions",
    servers: "Control servers",
    addons: "Extend addons",
};

export function ForestCapabilityScene() {
    const [
        activeId,
        setActiveId,
    ] = useState<HeroCapabilityId>(
        "world",
    );

    const activeCapability =
        useMemo(
            () =>
                heroCapabilities.find(
                    (
                        capability,
                    ) =>
                        capability.id
                        === activeId,
                )
                ?? heroCapabilities[0],
            [activeId],
        );

    function moveSelection(
        direction: number,
    ) {
        const currentIndex =
            heroCapabilities.findIndex(
                (
                    capability,
                ) =>
                    capability.id
                    === activeId,
            );

        const nextIndex =
            (
                currentIndex
                + direction
                + heroCapabilities.length
            )
            % heroCapabilities.length;

        setActiveId(
            heroCapabilities[
                nextIndex
            ].id,
        );
    }

    return (
        <div
            className={
                styles.capabilityExperience
            }
            data-capability-experience
        >
            <div
                className={
                    styles.capabilityControls
                }
                data-capability-control
                aria-label="ForestOfLight technical capabilities"
                onKeyDown={(
                    event,
                ) => {
                    if (
                        event.key
                        === "ArrowDown"
                        || event.key
                        === "ArrowRight"
                    ) {
                        event.preventDefault();
                        moveSelection(1);
                    }

                    if (
                        event.key
                        === "ArrowUp"
                        || event.key
                        === "ArrowLeft"
                    ) {
                        event.preventDefault();
                        moveSelection(-1);
                    }

                    if (
                        event.key
                        === "Home"
                    ) {
                        event.preventDefault();
                        setActiveId(
                            heroCapabilities[
                                0
                            ].id,
                        );
                    }

                    if (
                        event.key
                        === "End"
                    ) {
                        event.preventDefault();
                        setActiveId(
                            heroCapabilities[
                                heroCapabilities.length
                                - 1
                            ].id,
                        );
                    }
                }}
            >
                {heroCapabilities.map(
                    (
                        capability,
                        index,
                    ) => {
                        const active =
                            capability.id
                            === activeId;

                        return (
                            <button
                                key={
                                    capability.id
                                }
                                type="button"
                                aria-pressed={
                                    active
                                }
                                aria-controls="forest-capability-scene"
                                onClick={() =>
                                    setActiveId(
                                        capability.id,
                                    )
                                }
                                data-active={
                                    active
                                        ? "true"
                                        : "false"
                                }
                            >
                                <span>
                                    {String(
                                        index
                                        + 1,
                                    ).padStart(
                                        2,
                                        "0",
                                    )}
                                </span>

                                <strong>
                                    {
                                        labels[
                                            capability.id
                                        ]
                                    }
                                </strong>
                            </button>
                        );
                    },
                )}
            </div>

            <div
                id="forest-capability-scene"
                className={
                    styles.sceneFrame
                }
            >
                <header
                    className={
                        styles.sceneHeader
                    }
                >
                    <span>
                        {
                            activeCapability.eyebrow
                        }
                    </span>

                    <span
                        className={
                            styles.sceneStatus
                        }
                    >
                        <i
                            aria-hidden="true"
                        />
                        state active
                    </span>
                </header>

                <div
                    className={
                        styles.sceneViewport
                    }
                    data-mode={
                        activeCapability.id
                    }
                    aria-hidden="true"
                >
                    <div
                        className={
                            styles.sceneGrid
                        }
                    />

                    <div
                        className={
                            styles.sceneHorizon
                        }
                    />

                    <div
                        className={
                            styles.worldCluster
                        }
                    >
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                    <div
                        className={
                            styles.worldOverlay
                        }
                    >
                        <span>
                            BLOCK
                            <strong>
                                stone
                            </strong>
                        </span>

                        <span>
                            LIGHT
                            <strong>
                                15
                            </strong>
                        </span>

                        <span>
                            BIOME
                            <strong>
                                forest
                            </strong>
                        </span>

                        <span>
                            TPS
                            <strong>
                                20.0
                            </strong>
                        </span>
                    </div>

                    <div
                        className={
                            styles.testPath
                        }
                    >
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                    <div
                        className={
                            styles.testActor
                        }
                    >
                        <span />
                    </div>

                    <div
                        className={
                            styles.assertion
                        }
                    >
                        <span>
                            ASSERT
                        </span>
                        <strong>
                            target reached
                        </strong>
                    </div>

                    <div
                        className={
                            styles.buildLayers
                        }
                    >
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                    <div
                        className={
                            styles.materialLedger
                        }
                    >
                        <span>
                            stone
                            <strong>
                                128
                            </strong>
                        </span>

                        <span>
                            glass
                            <strong>
                                48
                            </strong>
                        </span>

                        <span>
                            redstone
                            <strong>
                                22
                            </strong>
                        </span>
                    </div>

                    <div
                        className={
                            styles.regionSelection
                        }
                    >
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                    <div
                        className={
                            styles.regionOffset
                        }
                    >
                        <span>
                            ΔX +12
                        </span>
                    </div>

                    <div
                        className={
                            styles.tickTrack
                        }
                    >
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                    <div
                        className={
                            styles.tickControl
                        }
                    >
                        <span>
                            WORLD
                        </span>
                        <strong>
                            FROZEN
                        </strong>
                        <small>
                            step +1 tick
                        </small>
                    </div>

                    <div
                        className={
                            styles.apiNetwork
                        }
                    >
                        <span
                            data-node="canopy"
                        >
                            Canopy
                        </span>

                        <span
                            data-node="extension"
                        >
                            Extension
                        </span>

                        <span
                            data-node="test"
                        >
                            Tests
                        </span>

                        <span
                            data-node="api"
                        >
                            API
                        </span>

                        <i />
                        <i />
                        <i />
                    </div>
                </div>

                <footer
                    className={
                        styles.sceneFooter
                    }
                >
                    <p
                        aria-live="polite"
                    >
                        {
                            activeCapability.description
                        }
                    </p>

                    <div>
                        {activeCapability.technicalLabels.map(
                            (
                                label,
                            ) => (
                                <code
                                    key={
                                        label
                                    }
                                >
                                    {label}
                                </code>
                            ),
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
}
