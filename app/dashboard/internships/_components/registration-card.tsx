"use client";

import {
  Briefcase,
  MapPin,
  Clock,
  Eye,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatDate, statusBadge } from "./helpers";
import type { Registration } from "./types";

export function RegistrationCard({
  item,
  onView,
}: {
  item: Registration;
  onView: (id: string) => void;
}) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      {/* IMAGE */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        {item.internshipImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.internshipImage}
            alt={item.internshipName ?? "Internship"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Briefcase className="h-10 w-10 text-primary/40" />
          </div>
        )}

        <div className="absolute right-3 top-3">
          {statusBadge(item.status)}
        </div>
      </div>

      {/* HEADER */}
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1 text-base">
          {item.internshipName ?? "—"}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {item.internshipDescription || "No description"}
        </CardDescription>
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {item.internshipMode && (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="capitalize">{item.internshipMode}</span>
            </span>
          )}

          {item.internshipDuration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {item.internshipDuration}
            </span>
          )}

          {item.internshipLocation && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {item.internshipLocation}
            </span>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col text-xs">
            <span className="text-muted-foreground">Registered</span>
            <span className="font-medium">
              {formatDate(item.registeredAt)}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(item.id)}
            className="gap-2"
          >
            <Eye className="h-3.5 w-3.5" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}