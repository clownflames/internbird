import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <Skeleton className="mb-3 h-6 w-48" />
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="py-0 gap-0">
            <CardContent className="p-4">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="mt-3 h-3 w-3/4" />
              <Skeleton className="mt-1.5 h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}