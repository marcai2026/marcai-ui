import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { ProfessionalForm } from "@/components/painel/professional-form";

export const metadata: Metadata = {
  title: "Editar profissional | Marcai",
};

export default async function EditarProfissionalPage({
  params,
}: {
  params: Promise<{ professionalId: string }>;
}) {
  const { professionalId } = await params;

  return (
    <PainelShell>
      <ProfessionalForm professionalId={professionalId} />
    </PainelShell>
  );
}
