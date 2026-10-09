import type { Metadata } from "next";

import { AppointmentDetail } from "@/components/painel/appointment-detail";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Agendamento | Marcai",
};

export default async function AgendamentoPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;

  return (
    <PainelShell>
      <AppointmentDetail appointmentId={appointmentId} />
    </PainelShell>
  );
}
