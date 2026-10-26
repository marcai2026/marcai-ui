"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Subcategory = {
  id: string;
  name: string;
  description: string | null;
};

type BusinessCategory = {
  id: string;
  name: string;
  subcategories: Subcategory[];
};

type Company = {
  businessCategoryId: string | null;
};

type ServiceCategory = {
  id: string;
  name: string;
  isActive: boolean;
  businessSubcategoryId: string | null;
};

type Service = {
  categoryId: string;
};

export function CategoriesBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [branchName, setBranchName] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [offerings, setOfferings] = useState<ServiceCategory[]>([]);
  const [serviceCount, setServiceCount] = useState<Record<string, number>>({});
  const [loadedCompanyId, setLoadedCompanyId] = useState<string | null>(null);
  const loading = Boolean(companyId) && loadedCompanyId !== companyId;
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;

    Promise.all([
      api<Company>(`/api/companies/${companyId}`),
      api<BusinessCategory[]>("/api/business-categories"),
      api<ServiceCategory[]>(`/api/companies/${companyId}/service-categories`),
      api<Service[]>(`/api/companies/${companyId}/services`),
    ])
      .then(([company, catalog, categories, services]) => {
        if (!active) {
          return;
        }

        const branch = catalog.find((item) => item.id === company.businessCategoryId) ?? null;
        const visible = branch ? branch.subcategories : catalog.flatMap((item) => item.subcategories);
        setBranchName(branch?.name ?? null);
        setSubcategories([...visible].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
        setOfferings(categories);
        setServiceCount(
          services.reduce<Record<string, number>>((counts, service) => {
            counts[service.categoryId] = (counts[service.categoryId] ?? 0) + 1;
            return counts;
          }, {}),
        );
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar as subcategorias.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadedCompanyId(companyId);
        }
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  async function toggle(subcategory: Subcategory) {
    if (!companyId) {
      return;
    }

    const current = offerings.find((item) => item.businessSubcategoryId === subcategory.id);
    setPendingId(subcategory.id);
    setError(null);

    try {
      const saved = current
        ? await api<ServiceCategory>(`/api/companies/${companyId}/service-categories/${current.id}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: !current.isActive }),
          })
        : await api<ServiceCategory>(`/api/companies/${companyId}/service-categories`, {
            method: "POST",
            body: JSON.stringify({
              name: subcategory.name.slice(0, 100),
              description: subcategory.description,
              businessSubcategoryId: subcategory.id,
            }),
          });

      setOfferings((items) => {
        const rest = items.filter((item) => item.id !== saved.id && item.businessSubcategoryId !== subcategory.id);
        return [...rest, saved];
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível atualizar o que a empresa atende.");
    } finally {
      setPendingId(null);
    }
  }

  const activeCount = subcategories.filter((subcategory) => {
    return offerings.some((item) => item.businessSubcategoryId === subcategory.id && item.isActive);
  }).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">O que a empresa atende</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#B7B7C2]">
          {branchName
            ? `Subcategorias de ${branchName}. Marque as que entram na agenda.`
            : "Marque as subcategorias que a empresa oferece."}{" "}
          Serviços novos e profissionais usam só o que estiver ativo.
        </p>
      </div>

      {!companyId ? (
        <p className="rounded-2xl border border-white/8 bg-[#141418] px-5 py-4 text-sm text-[#C8C8D0]">
          Essa lista pertence à empresa. Conclua o cadastro da empresa para escolher o que ela atende.
        </p>
      ) : null}

      {loading ? <p className="text-sm text-[#A7A7B2]">Carregando...</p> : null}
      {error ? <p className="text-sm text-[#ff8d90]">{error}</p> : null}

      {!loading && companyId && subcategories.length === 0 ? (
        <p className="text-sm text-[#A7A7B2]">Nenhuma subcategoria encontrada para o ramo da empresa.</p>
      ) : null}

      {subcategories.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Subcategorias</h2>
            <p className="text-sm text-[#A7A7B2]">
              {activeCount} de {subcategories.length} na agenda
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {subcategories.map((subcategory) => {
              const offering = offerings.find((item) => item.businessSubcategoryId === subcategory.id);
              const active = Boolean(offering?.isActive);
              const count = offering ? serviceCount[offering.id] ?? 0 : 0;

              return (
                <li
                  key={subcategory.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-[#101014] px-3.5 py-3"
                >
                  <div className="min-w-48 flex-1">
                    <p className="text-sm font-semibold text-white">{subcategory.name}</p>
                    <p className="text-xs text-[#A7A7B2]">
                      {subcategory.description || "Sem descrição"}
                      {active ? ` · ${count} serviço${count === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  {active ? (
                    <Link
                      href={`/painel/servicos/novo?subcategoria=${subcategory.id}`}
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Novo serviço
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    aria-label={`${subcategory.name} ${active ? "ativa" : "inativa"}`}
                    disabled={pendingId === subcategory.id}
                    className="relative h-7 w-12 shrink-0 cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => toggle(subcategory)}
                  >
                    <span className={`absolute inset-0 rounded-full ${active ? "bg-accent" : "bg-white/15"}`} />
                    <span
                      className={`absolute top-1 size-5 rounded-full bg-white shadow ${active ? "left-6" : "left-1"}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
