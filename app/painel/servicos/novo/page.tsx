import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { ServiceForm } from "@/components/painel/service-form";

export const metadata: Metadata = {
  title: "Cadastrar serviço | Marcai",
};

export default function NovoServicoPage() {
  return (
    <PainelShell>
      <ServiceForm />
    </PainelShell>
  );
}
