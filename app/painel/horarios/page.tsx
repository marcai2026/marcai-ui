import type { Metadata } from "next";

import { HoursBoard } from "@/components/painel/hours-board";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Horários | Marcai",
};

export default function HorariosPage() {
  return (
    <PainelShell>
      <HoursBoard />
    </PainelShell>
  );
}
