import type { Metadata } from "next";

import { ClientsBoard } from "@/components/painel/clients-board";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Clientes | Marcai",
};

export default function ClientesPage() {
  return (
    <PainelShell>
      <ClientsBoard />
    </PainelShell>
  );
}
