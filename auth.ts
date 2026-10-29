import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { resolveAccess } from "@/lib/access";
import { getUsersFresh } from "@/lib/settings";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email || profile?.email_verified === false) return false;
      return resolveAccess(user.email, await getUsersFresh()) !== null;
    },
  },
});
