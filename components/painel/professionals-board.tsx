"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Professional = {
  id: string;
  name: string;
  phone: string | null;
  bio: string | null;
};

export function ProfessionalsBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    setLoading(true);
    api<Professional[]>(`/api/companies/${companyId}/professionals`)
      .then((result) => {
        if (!active) {
          return;
        }
        setProfessionals(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar os profissionais.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  const showEmpty = !loading && !error && professionals.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Profissionais</h1>
          <p className="mt-1 text-sm text-[#B7B7C2]">Quem executa os serviços na agenda.</p>
        </div>
        <Link
          href="/painel/profissionais/novo"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0]"
        >
          Cadastrar profissional
        </Link>
      </div>

      {loading ? <p className="text-sm text-[#A7A7B2]">Carregando...</p> : null}
      {error ? <p className="text-sm text-[#ff8d90]">{error}</p> : null}

      {showEmpty ? (
        <section className="flex flex-col items-center rounded-2xl border border-white/8 bg-[#141418] px-6 py-16 text-center">
          <UserRound className="size-24 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="mt-6 text-xl font-semibold text-white">Nenhum profissional ainda</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#B7B7C2]">
            Cadastre nome e telefone de quem atende. A bio e a foto podem ficar para depois.
          </p>
        </section>
      ) : null}

      {!loading && !error && professionals.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <ul className="divide-y divide-white/8">
            {professionals.map((professional) => (
              <li key={professional.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {initials(professional.name)}
                </span>
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-semibold text-white">{professional.name}</p>
                  <p className="text-xs text-[#A7A7B2]">{professional.phone || professional.bio || "Sem telefone"}</p>
                </div>
                <Link
                  href={`/painel/profissionais/${professional.id}`}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
