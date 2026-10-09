"use client";

import { Binoculars } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
};

type CustomerList = {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
  };
};

export function ClientsBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (appliedSearch) {
      params.set("search", appliedSearch);
    }

    setLoading(true);
    api<CustomerList>(`/api/companies/${companyId}/customers?${params.toString()}`)
      .then((result) => {
        if (!active) {
          return;
        }
        setCustomers(result.data);
        setTotal(result.meta.total);
        setTotalPages(result.meta.totalPages || 1);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar os clientes.");
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
  }, [appliedSearch, companyId, page]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  const showEmpty = !loading && !error && customers.length === 0 && !appliedSearch;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Clientes</h1>
          <p className="mt-1 text-sm text-[#B7B7C2]">Quem a equipe cadastra para marcar horário.</p>
        </div>
        <Link
          href="/painel/clientes/novo"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0]"
        >
          Cadastrar cliente
        </Link>
      </div>

      {showEmpty ? (
        <section className="flex flex-col items-center rounded-2xl border border-white/8 bg-[#141418] px-6 py-16 text-center">
          <EmptyClients />
          <h2 className="mt-6 text-xl font-semibold text-white">Nenhum cliente ainda</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#B7B7C2]">
            Cadastre nome e telefone de quem você atende. Com isso, a equipe já consegue marcar o horário.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <form className="flex flex-wrap gap-2" onSubmit={submitSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
              placeholder="Buscar por nome, telefone ou e-mail"
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
          {!loading && !error && customers.length === 0 ? (
            <p className="mt-6 text-sm text-[#A7A7B2]">Nenhum cliente encontrado para essa busca.</p>
          ) : null}

          {customers.length > 0 ? (
            <ul className="mt-4 divide-y divide-white/8">
              {customers.map((customer) => (
                <li key={customer.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {initials(customer.name)}
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-semibold text-white">{customer.name}</p>
                    <p className="text-xs text-[#A7A7B2]">{contactLine(customer)}</p>
                  </div>
                  {customer.birthDate ? (
                    <span className="text-xs text-[#8E8E99]">{formatBirthDate(customer.birthDate)}</span>
                  ) : null}
                  <Link href={`/painel/clientes/${customer.id}`} className="text-sm font-semibold text-accent hover:underline">
                    Editar
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm text-[#A7A7B2]">
              <span>
                {total} cliente{total === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  className="h-9 cursor-pointer rounded-lg px-3 hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  className="h-9 cursor-pointer rounded-lg px-3 hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}
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

function contactLine(customer: Customer) {
  return [customer.phone, customer.email].filter(Boolean).join(" · ") || "Sem telefone ou e-mail";
}

function formatBirthDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

function EmptyClients() {
  return <Binoculars className="size-24 text-accent" strokeWidth={1.5} aria-hidden="true" />;
}
