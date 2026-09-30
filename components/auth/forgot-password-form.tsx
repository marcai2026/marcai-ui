"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { MarcaiLogo } from "@/components/brand/marcai-logo";
import { ApiError, api } from "@/lib/api";
import { firstFieldErrors, forgotPasswordSchema } from "@/lib/auth-schemas";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(firstFieldErrors<"email">(parsed.error).email ?? null);
      return;
    }

    setEmailError(null);
    setPending(true);

    try {
      const result = await api<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setMessage(result.message);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Não foi possível enviar o pedido.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-8 text-center">
        <Link href="/" className="mb-7 flex cursor-pointer justify-center transition-opacity hover:opacity-80">
          <MarcaiLogo variant="light" className="h-8 w-auto" />
        </Link>
        <h1 className="font-sans text-xl font-semibold leading-snug text-white">
          Esqueceu sua senha?
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#C8C8D0]">
          Informe o e-mail da conta. Se ele existir, enviaremos as instruções.
        </p>
      </div>

      <form className="space-y-3" noValidate onSubmit={handleSubmit}>
        <div>
          <label
            className={`flex h-12 items-center gap-3 rounded-lg border bg-[#101012] px-3.5 transition-colors focus-within:border-accent ${
              emailError ? "border-[#E5484D]" : "border-white/15"
            }`}
          >
            <span className="text-[#A8A8B3]">
              <MailIcon />
            </span>
            <input
              className="h-full w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#8E8E99]"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
              }}
              placeholder="E-mail"
              type="email"
              autoComplete="email"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "forgot-email-error" : undefined}
            />
          </label>
          {emailError ? (
            <p id="forgot-email-error" className="mt-1.5 text-sm text-[#ff8d90]" role="alert">
              {emailError}
            </p>
          ) : null}
        </div>

        {message ? (
          <p className="rounded-lg bg-white/5 px-3 py-2 text-sm leading-5 text-[#D4D4DC]" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-[#E5484D]/10 px-3 py-2 text-sm text-[#ff8d90]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full cursor-pointer rounded-lg bg-accent font-sans text-base font-semibold text-[#062626] transition-colors hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Aguarde..." : "Enviar instruções"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-5 block cursor-pointer text-center text-sm font-semibold text-[#D4D4DC] underline-offset-4 hover:text-white hover:underline"
      >
        Voltar para entrar
      </Link>
    </AuthShell>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
