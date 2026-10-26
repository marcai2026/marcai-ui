import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | Marcai",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex flex-1 bg-[#070708]" />}>
      <LoginForm />
    </Suspense>
  );
}
