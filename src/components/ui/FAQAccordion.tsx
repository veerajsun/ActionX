"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FAQAccordionProps {
  items: FaqItem[];
}

/** Single-open FAQ accordion used on the home page's Knowledge Base section. */
export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-space-xs">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-toggle-${index}`;
        return (
          <div key={item.question} className="overflow-hidden rounded-xl bg-surface-container">
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex min-h-[44px] w-full items-center justify-between px-space-md py-space-md text-left transition-colors"
            >
              <span className="pr-space-xs font-headline-sm text-body-md font-semibold text-on-surface">
                {item.question}
              </span>
              <span
                className={cn(
                  "material-symbols-outlined text-[20px] text-outline transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              >
                expand_more
              </span>
            </button>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-space-md pb-space-md font-body-md text-body-md text-on-surface-variant"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
