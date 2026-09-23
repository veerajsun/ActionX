import Link from "next/link";
import type { ReactNode } from "react";

interface ToolCardProps {
  icon: string;
  iconColorClassName: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  visual: ReactNode;
}

/** Feature card shell for the home page's "Everything you need" section. */
export function ToolCard({
  icon,
  iconColorClassName,
  title,
  description,
  ctaLabel,
  href,
  visual,
}: ToolCardProps) {
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-md shadow-md">
      {visual}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-xs">
          <span className={`material-symbols-outlined text-[20px] ${iconColorClassName}`}>
            {icon}
          </span>
          <h3 className="font-headline-sm text-headline-sm font-semibold">{title}</h3>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
      </div>
      <Link
        href={href}
        className="flex min-h-[44px] w-full items-center justify-center gap-space-xs rounded-lg bg-surface-variant font-body-md text-body-md font-medium text-on-surface transition-colors hover:bg-surface-bright"
      >
        <span>{ctaLabel}</span>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  );
}
