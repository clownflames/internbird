import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InternshipsSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <Skeleton className="mb-3 h-6 w-48" />
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>

      {[1, 2, 3].map((i) => (
        <Card key={i} className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}