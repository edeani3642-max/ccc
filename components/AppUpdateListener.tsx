"use client";

import {
    useEffect,
} from "react";

const VERSION_KEY =
    "campuscodecamp:app-version";

export default function AppUpdateListener() {
    useEffect(() => {
        if (
            !("serviceWorker" in navigator)
        ) {
            return;
        }

        const handleMessage = (
            event: MessageEvent,
        ) => {
            const data =
                event.data;

            if (
                !data ||
                data.type !==
                    "APP_VERSION"
            ) {
                return;
            }

            const newVersion =
                String(data.version);

            const currentVersion =
                localStorage.getItem(
                    VERSION_KEY,
                );

            if (!currentVersion) {
                localStorage.setItem(
                    VERSION_KEY,
                    newVersion,
                );

                return;
            }

            if (
                currentVersion !==
                newVersion
            ) {
                localStorage.setItem(
                    VERSION_KEY,
                    newVersion,
                );

                window.location.reload();
            }
        };

        navigator.serviceWorker.addEventListener(
            "message",
            handleMessage,
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "message",
                handleMessage,
            );
        };
    }, []);

    return null;
}