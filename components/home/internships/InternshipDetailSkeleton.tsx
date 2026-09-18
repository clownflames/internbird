import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InternshipDetailSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="py-0 gap-0 overflow-hidden">
        <Skeleton className="h-40 w-full rounded-none" />
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}