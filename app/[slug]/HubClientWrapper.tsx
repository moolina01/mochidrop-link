"use client";

import dynamicImport from "next/dynamic";

// ssr: false must live in a Client Component — not allowed in Server Components.
// This wrapper exists solely to host that constraint.
const HubClient = dynamicImport(() => import("./HubClient"), { ssr: false });

export default HubClient;
