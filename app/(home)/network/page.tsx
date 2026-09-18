import { Suspense } from "react";

import NetworkClient from "@/components/home/network/NetworkClient";
import NetworkSkeleton from "@/components/home/network/NetworkSkeleton";

import { getNetworkData } from "./actions";

/* =========================================================
   NETWORK PAGE
========================================================= */

export default function NetworkPage() {
  return (
    <Suspense fallback={<NetworkSkeleton />}>
      <NetworkSection />
    </Suspense>
  );
}

async function NetworkSection() {
  const data = await getNetworkData();
  return <NetworkClient data={data} />;
}