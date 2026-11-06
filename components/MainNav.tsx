"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/social", label: "Social media" },
  { href: "/brand", label: "Brand" },
  { href: "/shop", label: "Order & shop" },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav className="main-nav" aria-label="Main">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
