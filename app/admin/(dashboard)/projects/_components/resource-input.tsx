"use client";

import { Plus, Trash2, ExternalLink, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = { title: string; url: string } | { name: string; url: string };

export function ResourceInput({
  value,
  onChange,
  titleKey,
  placeholder = { title: "e.g. Docs, Figma", url: "https://..." },
  emptyLabel = "resource",
}: {
  value: Item[];
  onChange: (items: Item[]) => void;
  titleKey: "title" | "name";
  placeholder?: { title: string; url: string };
  emptyLabel?: string;
}) {
  const add = () => {
    onChange([...value, { [titleKey]: "", url: "" } as Item]);
  };

  const update = (i: number, key: "title" | "name" | "url", v: string) => {
    const next = [...value];
    next[i] = { ...(next[i] as any), [key]: v };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No {emptyLabel}s added yet.
        </p>
      )}

      {value.map((item, i) => {
        const title = (item as any)[titleKey] as string;
        return (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md border bg-muted/20 p-2"
          >
            <div className="flex-1 space-y-1.5">
              <Input
                value={title}
                onChange={(e) =>
                  update(i, titleKey as "title" | "name", e.target.value)
                }
                placeholder={placeholder.title}
                className="h-8 text-xs"
              />
              <Input
                value={item.url}
                onChange={(e) => update(i, "url", e.target.value)}
                placeholder={placeholder.url}
                className="h-8 text-xs"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        className="h-8 gap-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add {emptyLabel}
      </Button>
    </div>
  );
}