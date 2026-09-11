// components/ServiceWorkerRegistration.tsx

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) {
            return;
        }

        navigator.serviceWorker.register("/sw.js");
    }, []);

    return null;
}