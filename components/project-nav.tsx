"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "ภาพรวม" },
  { href: "/plan", label: "แผนเป้าหมาย" },
  { href: "/hub", label: "งานและเอกสาร" },
  { href: "/chat", label: "แชท AI" },
  { href: "/evidence", label: "หลักฐาน" },
  { href: "/evaluation", label: "ประเมิน" },
  { href: "/notifications", label: "แจ้งเตือน" },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map((link) => {
        const href = `${base}${link.href}`;
        const active =
          link.href === ""
            ? pathname === base
            : pathname.startsWith(href);

        return (
          <Link
            key={link.href}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
