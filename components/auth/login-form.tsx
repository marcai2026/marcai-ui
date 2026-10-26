"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MarcaiLogo } from "@/components/brand/marcai-logo";
import { ApiError, api } from "@/lib/api";
import { firstFieldErrors, loginSchema, registerSchema } from "@/lib/auth-schemas";
import { readCompanyId, saveSession, type SessionUser } from "@/lib/session";

type Mode = "login" | "register";

type AuthResponse = {
  accessToken: string;
  user: SessionUser;
};

type FieldName = "name" | "email" | "password";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("modo") === "cadastrar" ? "register" : "login",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isLogin = mode === "login";

  function changeMode(next: Mode) {
    setMode(next);
    setError(null);
    setFieldErrors({});
    router.replace(next === "register" ? "/login?modo=cadastrar" : "/login", { scroll: false });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = (isLogin ? loginSchema : registerSchema).safeParse(
      isLogin ? { email, password } : { name, email, password },
    );

    if (!parsed.success) {
      setFieldErrors(firstFieldErrors<FieldName>(parsed.error));
      return;
    }

    setFieldErrors({});
    setPending(true);

    try {
      const result = await api<AuthResponse>(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });

      enter(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  function enter(result: AuthResponse) {
    saveSession(
      {
        accessToken: result.accessToken,
        user: result.user,
        companyId: readCompanyId(result.accessToken),
      },
      true,
    );

    router.push(readCompanyId(result.accessToken) ? "/painel" : "/onboarding");
  }

  async function signInWithGoogle(idToken: string) {
    setError(null);
    setPending(true);

    try {
      const result = await api<AuthResponse>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      enter(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível entrar com o Google.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/" className="mb-7 cursor-pointer transition-opacity hover:opacity-80">
          <MarcaiLogo variant="light" className="h-8 w-auto" />
        </Link>
        <h1 className="font-sans text-xl font-semibold leading-snug text-white">
          {isLogin ? "Que bom te ver de novo" : "Crie sua conta"}
        </h1>
      </div>

      <form className="space-y-3" noValidate onSubmit={handleSubmit}>
        {!isLogin ? (
          <Field
            icon={<UserIcon />}
            value={name}
            error={fieldErrors.name}
            onChange={(event) => {
              setName(event.target.value);
              setFieldErrors((current) => ({ ...current, name: undefined }));
            }}
            placeholder="Nome"
            autoComplete="name"
          />
        ) : null}

        <Field
          icon={<MailIcon />}
          value={email}
          error={fieldErrors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="E-mail"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
        />

        <Field
          icon={<LockIcon />}
          value={password}
          error={fieldErrors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="Senha"
          type={showPassword ? "text" : "password"}
          autoComplete={isLogin ? "current-password" : "new-password"}
          trailing={
            <button
              type="button"
              className="cursor-pointer text-[#A8A8B3] transition-colors hover:text-white"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        {isLogin ? (
          <div className="flex justify-end">
            <Link
              href="/esqueci-senha"
              className="cursor-pointer text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full cursor-pointer rounded-lg bg-accent font-sans text-base font-semibold text-[#062626] transition-colors hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold tracking-wide text-[#8E8E99]">
        <span className="h-px flex-1 bg-white/10" />
        OU
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleSignInButton disabled={pending} onCredential={signInWithGoogle} onError={setError} />
      {error ? (
        <p className="mt-3 rounded-lg bg-[#E5484D]/10 px-3 py-2 text-sm text-[#ff8d90]" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-5 text-center text-sm leading-6 text-[#C8C8D0]">
        {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
        <button
          type="button"
          onClick={() => changeMode(isLogin ? "register" : "login")}
          className="cursor-pointer font-semibold text-accent underline-offset-4 hover:underline"
        >
          {isLogin ? "Cadastre-se" : "Entrar"}
        </button>
      </p>
    </AuthShell>
  );
}

function Field({
  icon,
  trailing,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  trailing?: ReactNode;
  error?: string;
}) {
  const describedBy = error ? `${props.name ?? props.autoComplete}-error` : undefined;

  return (
    <div>
      <label
        className={`flex h-12 items-center gap-3 rounded-lg border bg-[#101012] px-3.5 transition-colors focus-within:border-accent ${
          error ? "border-[#E5484D]" : "border-white/15"
        }`}
      >
        <span className="text-[#A8A8B3]">{icon}</span>
        <input
          className="h-full w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#8E8E99]"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {trailing}
      </label>
      {error ? (
        <p id={describedBy} className="mt-1.5 text-sm text-[#ff8d90]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
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

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5.5 19.5c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-4 4.7M6.1 6.2C3.7 8 2 12 2 12s3.5 7 10 7c1.5 0 2.9-.3 4.2-.9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}


