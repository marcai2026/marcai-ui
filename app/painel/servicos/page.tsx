import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { ServicesBoard } from "@/components/painel/services-board";

export const metadata: Metadata = {
  title: "Serviços | Marcai",
};

export default function ServicosPage() {
  return (
    <PainelShell>
      <ServicesBoard />
    </PainelShell>
  );
}
