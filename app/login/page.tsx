import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Logo } from "@/components/Logo";
import { isDemo } from "@/lib/config";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  AccessDenied: "That Google account doesn't have access to the hub. Ask the marketing team to add your email, then try again.",
  Configuration: "Sign-in isn't set up correctly. Let the marketing team know.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (isDemo || (await getViewer())) redirect("/");
  const { error } = await searchParams;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <main className="login">
      <div className="hero">
        <div className="wrap" style={{ width: "100%" }}>
          <Logo markColor="#B08D57" />
        </div>
      </div>
      <div className="login-panel">
        <h1>Marketing Hub</h1>
        <p>Logos, job photos, print files and ordering links for Zinga&rsquo;s franchise owners and their teams.</p>
        {error ? <p className="login-error">{ERRORS[error] ?? "Sign-in didn't work. Try again."}</p> : null}
        <form action={signInWithGoogle}>
          <button type="submit" className="button">
            Sign in with Google
          </button>
        </form>
        <p style={{ fontSize: "0.9rem" }}>Use the email address the marketing team has on file for you.</p>
      </div>
    </main>
  );
}
