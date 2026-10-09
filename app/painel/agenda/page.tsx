import type { Metadata } from "next";

import { AgendaBoard } from "@/components/painel/agenda-board";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Agenda | Marcai",
};

export default function AgendaPage() {
  return (
    <PainelShell>
      <AgendaBoard />
    </PainelShell>
  );
}
