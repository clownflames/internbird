"use client";

import { cn } from "@/lib/utils";

interface BodyWrapperProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  /** hide left sidebar (e.g. for full-width pages) */
  hideLeft?: boolean;
  /** hide right sidebar */
  hideRight?: boolean;
  /** main content max width override */
  className?: string;
}

/* =========================================================
   BODY WRAPPER
   LinkedIn-style 3 column layout
   - left  : fixed width (sticky)
   - center: flexible (main content)
   - right : fixed width (sticky)
========================================================= */

export default function BodyWrapper({
  children,
  leftSidebar,
  rightSidebar,
  hideLeft = false,
  hideRight = false,
  className,
}: BodyWrapperProps) {
  const showLeft = !hideLeft && !!leftSidebar;
  const showRight = !hideRight && !!rightSidebar;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
      <div
        className={cn(
          "flex w-full items-start gap-4 py-4 lg:gap-6 lg:py-6",
          className
        )}
      >
        {/* ================= LEFT SIDEBAR ================= */}
        {showLeft && (
          <aside
            className={cn(
              "hidden shrink-0 md:block",
              "w-[225px] lg:w-[250px]",
              "sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto",
              "scrollbar-thin"
            )}
          >
            {leftSidebar}
          </aside>
        )}

        {/* ================= MAIN CONTENT ================= */}
        <main className="min-w-0 flex-1">
          {children}
        </main>

        {/* ================= RIGHT SIDEBAR ================= */}
        {showRight && (
          <aside
            className={cn(
              "hidden shrink-0 lg:block",
              "w-[300px]",
              "sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto",
              "scrollbar-thin"
            )}
          >
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}