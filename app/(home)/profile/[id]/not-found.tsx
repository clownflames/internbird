import Link from "next/link";
import { UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfileNotFound() {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <UserX className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">User not found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This profile doesn't exist or has been removed
          </p>
        </div>
        <Button size="sm" >
          <Link href="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}