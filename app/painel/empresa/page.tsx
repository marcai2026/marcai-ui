import type { Metadata } from "next";

import { CompanyBoard } from "@/components/painel/company-board";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Empresa | Marcai",
};

export default function EmpresaPage() {
  return (
    <PainelShell>
      <CompanyBoard />
    </PainelShell>
  );
}
