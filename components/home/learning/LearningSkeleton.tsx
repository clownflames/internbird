import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearningSkeleton() {
  return (
    <div className="w-full space-y-3">
      {/* header */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <Skeleton className="mb-3 h-6 w-48" />
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>

      {/* grid — matches new 4-column full-width layout */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="py-0 gap-0 overflow-hidden flex flex-col h-full">
            {/* cover */}
            <Skeleton className="aspect-[16/10] w-full rounded-none" />

            {/* content */}
            <CardContent className="p-3.5 space-y-2">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}