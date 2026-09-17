import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="overflow-hidden py-0 gap-0">
        <Skeleton className="h-40 w-full rounded-none" />
        <CardContent className="p-4">
          <div className="-mt-16 flex items-end gap-4">
            <Skeleton className="h-28 w-28 rounded-full border-4 border-background" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}