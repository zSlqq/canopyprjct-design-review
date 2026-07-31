"use client";

import {
    MotionConfig,
    useReducedMotion,
} from "framer-motion";
import {
    type ReactNode,
    useSyncExternalStore,
} from "react";

const subscribeToHydration = () => {
    return () => {};
};

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function MotionPreferences({
    children,
}: {
    children: ReactNode;
}) {
    const hydrated =
        useSyncExternalStore(
            subscribeToHydration,
            getClientSnapshot,
            getServerSnapshot,
        );

    const prefersReducedMotion =
        useReducedMotion();

    const reducedMotion =
        hydrated &&
        Boolean(prefersReducedMotion)
            ? "always"
            : "never";

    return (
        <MotionConfig
            reducedMotion={reducedMotion}
        >
            {children}
        </MotionConfig>
    );
}
