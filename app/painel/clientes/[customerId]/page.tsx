import type { Metadata } from "next";

import { ClientForm } from "@/components/painel/client-form";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Editar cliente | Marcai",
};

export default async function EditarClientePage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;

  return (
    <PainelShell>
      <ClientForm customerId={customerId} />
    </PainelShell>
  );
}
