"use client";

import { useSyncExternalStore } from "react";

import { PainelShell } from "@/components/painel/painel-shell";
import { SalonBoard } from "@/components/painel/salon-board";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

export function PainelHome() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const firstName = session?.user.name.trim().split(/\s+/)[0] || "você";

  return (
    <PainelShell>
      <SalonBoard firstName={firstName} />
    </PainelShell>
  );
}
