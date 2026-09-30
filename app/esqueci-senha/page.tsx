import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueceu a senha | Marcai",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
