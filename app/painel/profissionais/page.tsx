import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { ProfessionalsBoard } from "@/components/painel/professionals-board";

export const metadata: Metadata = {
  title: "Profissionais | Marcai",
};

export default function ProfissionaisPage() {
  return (
    <PainelShell>
      <ProfessionalsBoard />
    </PainelShell>
  );
}
