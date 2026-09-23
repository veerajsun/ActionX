import Link from "next/link";
import { ActionXLogo } from "@/components/icons/ActionXLogo";
import { FOOTER_COMPANY_LINKS, FOOTER_TOOL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-space-2xl flex flex-col gap-space-lg bg-surface-container-lowest px-gutter py-space-xl text-on-surface-variant md:px-gutter-desktop">
      <div className="mx-auto flex w-full max-w-workspace flex-col gap-space-lg">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm">
            <ActionXLogo className="h-6 w-auto" withWordmark={false} />
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              ActionX
            </span>
          </div>
          <p className="max-w-md font-body-sm text-body-sm text-on-surface-variant">
            Download. Convert. Simplify. High-performance media engine engineered for seamless
            conversion and delivery.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-space-lg pt-space-xs md:grid-cols-4">
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Tools
            </span>
            {FOOTER_TOOL_LINKS.map((item) => (
              <Link
                key={item.path}
                href={item.href}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-code-sm text-label-code-sm uppercase tracking-wider text-outline">
              Company
            </span>
            {FOOTER_COMPANY_LINKS.map((item) => (
              <Link
                key={item.path}
                href={item.href}
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-space-md font-label-code-sm text-label-code-sm text-outline">
          <p>© {new Date().getFullYear()} ActionX. All rights reserved.</p>
          <span className="font-label-code-sm text-label-code-sm text-tertiary">v2.4.0</span>
        </div>
      </div>
    </footer>
  );
}
