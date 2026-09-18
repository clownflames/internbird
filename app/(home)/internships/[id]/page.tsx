import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import InternshipDetailClient from "@/components/home/internships/InternshipDetailClient";
import InternshipDetailSkeleton from "@/components/home/internships/InternshipDetailSkeleton";

import { getInternshipDetail } from "./actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InternshipDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-3">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        
        className="gap-1.5 text-muted-foreground"
      >
        <Link href="/internships">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to internships
        </Link>
      </Button>

      <Suspense fallback={<InternshipDetailSkeleton />}>
        <DetailSection internshipId={id} />
      </Suspense>
    </div>
  );
}

async function DetailSection({ internshipId }: { internshipId: string }) {
  const internship = await getInternshipDetail(internshipId);

  if (!internship) {
    notFound();
  }

  return <InternshipDetailClient internship={internship} />;
}