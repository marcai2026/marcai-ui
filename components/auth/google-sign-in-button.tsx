"use client";

import { useEffect, useRef } from "react";

import { loadGoogleIdentity } from "@/lib/google-identity";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
};

export function GoogleSignInButton({ disabled = false, onCredential, onError }: GoogleSignInButtonProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || !hostRef.current) {
      return;
    }

    const host = hostRef.current;
    let cancelled = false;

    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !window.google?.accounts.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (response) => {
            if (!response.credential) {
              onErrorRef.current("O Google não devolveu um token de acesso.");
              return;
            }

            onCredentialRef.current(response.credential);
          },
        });

        host.replaceChildren();
        window.google.accounts.id.renderButton(host, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.min(400, Math.max(240, Math.floor(host.getBoundingClientRect().width))),
          locale: "pt-BR",
        });
      })
      .catch((caught: unknown) => {
        onErrorRef.current(caught instanceof Error ? caught.message : "Não foi possível carregar o login do Google.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!clientId) {
    return (
      <button
        type="button"
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-[15px] font-semibold text-white transition-colors hover:border-accent hover:bg-white/10"
        onClick={() =>
          onError(
            "Defina NEXT_PUBLIC_GOOGLE_CLIENT_ID com o Client ID Web do Google e reinicie o front.",
          )
        }
      >
        <GoogleIcon />
        Continuar com Google
      </button>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div ref={hostRef} className="flex min-h-12 w-full items-center justify-center" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
