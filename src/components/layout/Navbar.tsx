"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ActionXLogo } from "@/components/icons/ActionXLogo";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Maps a pathname to the nav item whose label should show in the header. */
function useActiveLabel(pathname: string): string {
  const match = NAV_ITEMS.find((item) => item.href === pathname);
  return match?.label ?? "ActionX";
}

export function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeLabel = useActiveLabel(pathname);

  return (
    <header className="fixed top-0 z-50 w-full pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex h-16 items-center justify-between px-gutter md:px-gutter-desktop">
        <Link href="/" className="flex items-center gap-space-sm" aria-label="ActionX home">
          <ActionXLogo className="h-8 w-auto" withWordmark={false} />
          <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
            ActionX
          </span>
        </Link>

        <div className="flex items-center gap-space-xs">
          <span className="hidden max-w-[160px] truncate font-headline-sm text-headline-sm text-on-surface xs:block">
            {activeLabel}
          </span>
          <nav className="hidden items-center gap-space-lg md:flex" aria-label="Primary">
            {NAV_ITEMS.slice(1).map((item) => (
              <Link
                key={item.path}
                href={item.href}
                className={cn(
                  "font-body-md text-body-md transition-colors hover:text-on-surface",
                  pathname === item.href ? "text-primary" : "text-on-surface-variant",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="flex min-h-[44px] items-center justify-center rounded-full bg-primary-container px-space-md py-space-xs font-headline-sm text-body-sm text-on-primary-container transition-opacity hover:opacity-90 active:scale-95"
          >
            Get Started
          </button>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:text-on-surface md:hidden"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            <span className="material-symbols-outlined text-[24px]">
              {drawerOpen ? "close" : "menu"}
            </span>
          </button>
          <div className="ml-space-xs flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="material-symbols-outlined text-[18px] text-on-primary">
              person
            </span>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div
          id="mobile-drawer"
          className="flex flex-col gap-space-xs bg-surface-container-low px-gutter pb-space-lg pt-space-xs shadow-[0_12px_32px_-4px_rgba(0,0,0,0.7)] md:hidden"
        >
          <nav className="flex flex-col gap-space-2xs" aria-label="Mobile">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex min-h-[44px] items-center gap-space-sm rounded-lg px-space-md py-space-sm transition-colors hover:bg-surface-container hover:text-on-surface",
                  pathname === item.href ? "text-primary" : "text-on-surface-variant",
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-headline-sm text-body-md">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
