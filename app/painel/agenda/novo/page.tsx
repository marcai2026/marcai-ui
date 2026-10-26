import type { Metadata } from "next";

import { AppointmentForm } from "@/components/painel/appointment-form";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Novo agendamento | Marcai",
};

export default function NovoAgendamentoPage() {
  return (
    <PainelShell>
      <AppointmentForm />
    </PainelShell>
  );
}
