import type { Metadata } from "next";

import { PainelShell } from "@/components/painel/painel-shell";
import { ServiceForm } from "@/components/painel/service-form";

export const metadata: Metadata = {
  title: "Cadastrar serviço | Marcai",
};

export default async function NovoServicoPage({
  searchParams,
}: {
  searchParams: Promise<{ subcategoria?: string }>;
}) {
  const { subcategoria } = await searchParams;

  return (
    <PainelShell>
      <ServiceForm subcategoryId={subcategoria} />
    </PainelShell>
  );
}
