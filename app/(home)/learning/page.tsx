import { Suspense } from "react";

import LearningClient from "@/components/home/learning/LearningClient";
import LearningSkeleton from "@/components/home/learning/LearningSkeleton";

import { getLearningPages, getInternshipOptions } from "./actions";

export default function LearningPage() {
  return (
    <Suspense fallback={<LearningSkeleton />}>
      <LearningSection />
    </Suspense>
  );
}

async function LearningSection() {
  const [items, internshipOptions] = await Promise.all([
    getLearningPages({ sort: "latest" }),
    getInternshipOptions(),
  ]);

  return (
    <LearningClient
      initialItems={items}
      internshipOptions={internshipOptions}
    />
  );
}