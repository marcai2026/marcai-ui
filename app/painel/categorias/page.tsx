import type { Metadata } from "next";

import { CategoriesBoard } from "@/components/painel/categories-board";
import { PainelShell } from "@/components/painel/painel-shell";

export const metadata: Metadata = {
  title: "Subcategorias | Marcai",
};

export default function CategoriasPage() {
  return (
    <PainelShell>
      <CategoriesBoard />
    </PainelShell>
  );
}
