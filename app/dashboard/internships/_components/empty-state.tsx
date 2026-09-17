"use client";

import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Briefcase className="h-6 w-6 text-muted-foreground" />
        </div>

        <div>
          <p className="font-medium">No internships yet</p>
          <p className="text-sm text-muted-foreground">
            You haven&apos;t registered for any internship.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}