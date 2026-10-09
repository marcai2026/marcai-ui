import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { ProfessionalForm } from "@/components/painel/professional-form";

export const metadata: Metadata = {
  title: "Cadastrar profissional | Marcai",
};

export default function NovoProfissionalPage() {
  return (
    <PainelShell>
      <ProfessionalForm />
    </PainelShell>
  );
}
