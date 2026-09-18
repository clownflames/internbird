"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  X,
  MapPin,
  Link as LinkIcon,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { updateProfile } from "@/app/(home)/profile/actions";
import type { ProfileUser } from "@/app/(home)/profile/actions";

interface Props {
  user: ProfileUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileDrawer({ user, open, onOpenChange }: Props) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [headline, setHeadline] = useState(user.headline ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(user.name);
      setHeadline(user.headline ?? "");
      setBio(user.bio ?? "");
      setLocation(user.location ?? "");
      setWebsite(user.website ?? "");
      setError(null);
    }
  }, [open, user]);

  function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    startTransition(async () => {
      const res = await updateProfile({
        name,
        headline,
        bio,
        location,
        website,
      });

      setSubmitting(false);

      if (res.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to update profile");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-t-2xl p-0"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-muted" />
          <SheetTitle className="sr-only">Edit profile</SheetTitle>

          {/* HEADER */}
          <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
            <div>
              <p className="text-base font-semibold">Edit profile</p>
              <p className="text-xs text-muted-foreground">
                Update your personal information
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <Separator />

          {/* BODY */}
          <div className="space-y-4 px-5 py-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <UserIcon className="h-3 w-3" />
                Name *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                maxLength={150}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Headline</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Full Stack Developer | MERN"
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">About</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={4}
                maxLength={1000}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3" />
                  Location
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Mumbai, India"
                  maxLength={255}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <LinkIcon className="h-3 w-3" />
                  Website
                </Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  maxLength={255}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 px-5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}