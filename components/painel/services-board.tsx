"use client";

import { Scissors } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Service = {
  id: string;
  name: string;
  description: string | null;
  defaultDurationMinutes: number;
  category: { id: string; name: string } | null;
};

export function ServicesBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    const params = new URLSearchParams();
    if (appliedSearch) {
      params.set("search", appliedSearch);
    }

    setLoading(true);
    const query = params.size > 0 ? `?${params.toString()}` : "";
    api<Service[]>(`/api/companies/${companyId}/services${query}`)
      .then((result) => {
        if (!active) {
          return;
        }
        setServices(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar os serviços.");
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
  }, [appliedSearch, companyId]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search.trim());
  }

  const showEmpty = !loading && !error && services.length === 0 && !appliedSearch;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Serviços</h1>
          <p className="mt-1 text-sm text-[#B7B7C2]">O que a equipe oferece na agenda.</p>
        </div>
        <Link
          href="/painel/servicos/novo"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0]"
        >
          Cadastrar serviço
        </Link>
      </div>

      {showEmpty ? (
        <section className="flex flex-col items-center rounded-2xl border border-white/8 bg-[#141418] px-6 py-16 text-center">
          <Scissors className="size-24 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="mt-6 text-xl font-semibold text-white">Nenhum serviço ainda</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#B7B7C2]">
            Cadastre o serviço em uma subcategoria que a empresa já atende.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <form className="flex flex-wrap gap-2" onSubmit={submitSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
              placeholder="Buscar por nome"
            />
            <button
              type="submit"
              className="h-11 cursor-pointer rounded-xl border border-white/10 px-4 text-sm font-semibold text-white hover:border-white/25"
            >
              Buscar
            </button>
          </form>

          {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}
          {error ? <p className="mt-6 text-sm text-[#ff8d90]">{error}</p> : null}
          {!loading && !error && services.length === 0 ? (
            <p className="mt-6 text-sm text-[#A7A7B2]">Nenhum serviço encontrado para essa busca.</p>
          ) : null}

          {services.length > 0 ? (
            <ul className="mt-4 divide-y divide-white/8">
              {services.map((service) => (
                <li key={service.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-1">
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-semibold text-white">{service.name}</p>
                    <p className="text-xs text-[#A7A7B2]">
                      {service.category?.name ?? "Sem subcategoria"}
                      {service.description ? ` · ${service.description}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-[#8E8E99]">{service.defaultDurationMinutes} min</span>
                  <Link href={`/painel/servicos/${service.id}`} className="text-sm font-semibold text-accent hover:underline">
                    Editar
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
    </div>
  );
}
