// app/providers.tsx
"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "./context/UserContext"; // Add our UserProvider

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <UserProvider>{children}</UserProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
