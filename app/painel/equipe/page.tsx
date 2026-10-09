import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { TeamBoard } from "@/components/painel/team-board";

export const metadata: Metadata = {
  title: "Equipe | Marcai",
};

export default function EquipePage() {
  return (
    <PainelShell>
      <TeamBoard />
    </PainelShell>
  );
}
