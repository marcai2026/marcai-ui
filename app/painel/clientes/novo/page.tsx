import type { Metadata } from "next";

import { ClientForm } from "@/components/painel/client-form";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Cadastrar cliente | Marcai",
};

export default function NovoClientePage() {
  return (
    <PainelShell>
      <ClientForm />
    </PainelShell>
  );
}
