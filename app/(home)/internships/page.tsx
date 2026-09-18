import { Suspense } from "react";

import InternshipsClient from "@/components/home/internships/InternshipsClient";
import InternshipsSkeleton from "@/components/home/internships/InternshipsSkeleton";

import { getInternships } from "./actions";

export default function InternshipsPage() {
  return (
    <Suspense fallback={<InternshipsSkeleton />}>
      <InternshipsSection />
    </Suspense>
  );
}

async function InternshipsSection() {
  const items = await getInternships({ sort: "latest" });
  return <InternshipsClient initialItems={items} />;
}