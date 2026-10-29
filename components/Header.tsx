import Link from "next/link";
import { signOut } from "@/auth";
import { isDemo } from "@/lib/config";
import type { Viewer } from "@/lib/types";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";

export function Header({ viewer }: { viewer: Viewer }) {
  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand-link">
          <Logo markColor="var(--gold)" title="Zinga's Marketing Hub home" />
          <span>Marketing Hub</span>
        </Link>
        <MainNav />
        <form action="/search" role="search" className="header-search">
          <label htmlFor="header-q" className="visually-hidden">
            Search the library
          </label>
          <input id="header-q" name="q" type="search" placeholder="Search logos, photos, print files" />
        </form>
        <div className="account">
          <span className="account-name">{viewer.name}</span>
          {!isDemo && (
            <form action={signOutAction}>
              <button type="submit">Sign out</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
