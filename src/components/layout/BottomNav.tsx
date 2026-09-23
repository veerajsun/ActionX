"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 z-50 w-full pb-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] md:hidden"
      aria-label="Bottom"
    >
      <div className="flex h-16 items-center justify-around px-space-sm">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.path}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center px-space-xs transition-colors",
                isActive
                  ? "font-semibold text-primary"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="mt-space-2xs font-body-sm text-body-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
