import type { Metadata } from "next";

import { PainelHome } from "@/components/painel/painel-home";

export const metadata: Metadata = {
  title: "Painel | Marcai",
};

export default function PainelPage() {
  return <PainelHome />;
}
