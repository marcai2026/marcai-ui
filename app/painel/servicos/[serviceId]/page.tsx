import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { ServiceForm } from "@/components/painel/service-form";

export const metadata: Metadata = {
  title: "Editar serviço | Marcai",
};

export default async function EditarServicoPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;

  return (
    <PainelShell>
      <ServiceForm serviceId={serviceId} />
    </PainelShell>
  );
}
