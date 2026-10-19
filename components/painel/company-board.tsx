"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Company = {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
};

function photoUrlMessage(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "Informe um endereço de foto válido.";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Informe um endereço de foto válido.";
  }

  if (!/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)) {
    return "Cole o link direto da imagem, não o da página.";
  }

  return null;
}

export function CompanyBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    api<Company>(`/api/companies/${companyId}`)
      .then((result) => {
        if (active) {
          setCompany({
            name: result.name,
            slug: result.slug,
            description: result.description ?? "",
            logoUrl: result.logoUrl ?? "",
            phone: result.phone ?? "",
            email: result.email ?? "",
            timezone: result.timezone,
          });
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar a empresa.");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId || !company) {
      return;
    }

    const invalidPhoto = photoUrlMessage(company.logoUrl ?? "");
    if (invalidPhoto) {
      setPhotoError(invalidPhoto);
      return;
    }

    setPending(true);
    setError(null);
    setPhotoError(null);
    setSaved(false);
    try {
      const updated = await api<Company>(`/api/companies/${companyId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: company.name,
          slug: company.slug,
          description: company.description || null,
          logoUrl: company.logoUrl?.trim() || null,
          phone: company.phone || null,
          email: company.email || null,
          timezone: company.timezone,
        }),
      });
      setCompany({
        ...updated,
        description: updated.description ?? "",
        logoUrl: updated.logoUrl ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? "",
      });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível salvar a empresa.");
    } finally {
      setPending(false);
    }
  }

  function update(patch: Partial<Company>) {
    setCompany((current) => (current ? { ...current, ...patch } : current));
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Empresa</h1>
      <p className="mt-1 text-sm text-[#B7B7C2]">Nome, contato, foto e fuso usados na agenda.</p>
      {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}
      {company ? (
        <form className="mt-6 rounded-2xl border border-white/8 bg-[#141418] p-5" onSubmit={handleSubmit}>
          <Field label="Nome" value={company.name} onChange={(name) => update({ name })} />
          <Field label="Slug" value={company.slug} onChange={(slug) => update({ slug })} />
          <label className="mt-4 block text-sm text-[#C8C8D0]">
            Descrição
            <textarea
              value={company.description ?? ""}
              onChange={(event) => update({ description: event.target.value })}
              className="mt-1.5 min-h-20 w-full rounded-xl border border-white/10 bg-[#101014] px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <Field
            label="Foto (endereço)"
            value={company.logoUrl ?? ""}
            error={photoError ?? undefined}
            placeholder="https://"
            onChange={(logoUrl) => {
              setPhotoError(photoUrlMessage(logoUrl));
              setSaved(false);
              update({ logoUrl });
            }}
          />
          {company.logoUrl && !photoError ? (
            <img src={company.logoUrl} alt="" className="mt-3 h-16 w-16 rounded-2xl object-cover" />
          ) : null}
          <Field label="Telefone" value={company.phone ?? ""} onChange={(phone) => update({ phone })} />
          <Field label="E-mail" value={company.email ?? ""} onChange={(email) => update({ email })} />
          <Field label="Fuso" value={company.timezone} onChange={(timezone) => update({ timezone })} />
          {error ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}
          {saved ? <p className="mt-4 text-sm text-accent">Dados salvos.</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-5 h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar empresa"}
          </button>
        </form>
      ) : null}
      {!loading && error && !company ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="mt-4 block text-sm text-[#C8C8D0] first:mt-0">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 h-11 w-full rounded-xl border bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent ${
          error ? "border-[#E5484D]" : "border-white/10"
        }`}
      />
      {error ? <span className="mt-1.5 block text-sm text-[#ff8d90]">{error}</span> : null}
    </label>
  );
}
