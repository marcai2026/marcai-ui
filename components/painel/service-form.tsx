"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { z } from "zod";

import { ApiError, api } from "@/lib/api";
import { firstFieldErrors } from "@/lib/auth-schemas";
import { formatPriceInput, formatStoredPrice, priceToApi } from "@/lib/money";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(100, "O nome pode ter no máximo 100 caracteres."),
  description: z.string().trim().max(500, "A descrição pode ter no máximo 500 caracteres."),
  categoryId: z.string().min(1, "Escolha o que a empresa atende."),
  price: z.string().trim().refine((value) => priceMessage(value) === null, "Informe um valor entre R$ 0,01 e R$ 99.999,99."),
  defaultDurationMinutes: z
    .string()
    .trim()
    .min(1, "Informe a duração.")
    .refine((value) => durationMessage(value) === null, "A duração precisa ficar entre 1 e 480 minutos."),
});

const maxDurationMinutes = 480;

function priceMessage(value: string) {
  const amount = Number(priceToApi(value));
  if (!Number.isFinite(amount) || amount < 0.01) {
    return "Informe o valor.";
  }
  if (amount > 99999.99) {
    return "O valor pode ter no máximo R$ 99.999,99.";
  }
  return null;
}

function formatDuration(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 3);
}

function durationMessage(value: string) {
  if (!/^\d+$/.test(value)) {
    return "A duração precisa ser um número de minutos maior que zero.";
  }

  const minutes = Number(value);
  if (minutes < 1) {
    return "A duração precisa ser um número de minutos maior que zero.";
  }
  if (minutes > maxDurationMinutes) {
    return "A duração pode ter no máximo 480 minutos.";
  }

  return null;
}

type FieldName = "name" | "description" | "categoryId" | "price" | "defaultDurationMinutes";

type Category = {
  id: string;
  name: string;
  isActive: boolean;
  businessSubcategoryId: string | null;
};

type Service = {
  name: string;
  description: string | null;
  categoryId: string;
  price: string;
  defaultDurationMinutes: number;
  isActive: boolean;
};

export function ServiceForm({ serviceId, subcategoryId }: { serviceId?: string; subcategoryId?: string }) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [appliedSubcategoryId, setAppliedSubcategoryId] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loadedServiceId, setLoadedServiceId] = useState<string | null>(null);
  const loading = Boolean(serviceId) && loadedServiceId !== serviceId;

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    api<Category[]>(`/api/companies/${companyId}/service-categories`)
      .then((result) => {
        if (active) {
          setCategories(result.filter((category) => category.isActive && category.businessSubcategoryId));
          setCategoriesError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setCategoriesError(caught instanceof ApiError ? caught.message : "Não foi possível carregar o que a empresa atende.");
        }
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  if (!serviceId && subcategoryId && subcategoryId !== appliedSubcategoryId) {
    const selected = categories.find((category) => category.businessSubcategoryId === subcategoryId);
    if (selected) {
      setAppliedSubcategoryId(subcategoryId);
      setCategoryId(selected.id);
    }
  }

  useEffect(() => {
    if (!companyId || !serviceId) {
      return;
    }

    let active = true;
    api<Service>(`/api/companies/${companyId}/services/${serviceId}`)
      .then((service) => {
        if (!active) {
          return;
        }
        setName(service.name);
        setDescription(service.description ?? "");
        setCategoryId(service.categoryId);
        setPrice(formatStoredPrice(service.price ?? ""));
        setDuration(String(service.defaultDurationMinutes));
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar o serviço.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadedServiceId(serviceId);
        }
      });

    return () => {
      active = false;
    };
  }, [companyId, serviceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = serviceSchema.safeParse({
      name,
      description,
      categoryId,
      price,
      defaultDurationMinutes: duration,
    });
    if (!parsed.success) {
      setFieldErrors(firstFieldErrors<FieldName>(parsed.error));
      return;
    }

    if (!companyId) {
      setError("Entre em uma empresa para cadastrar o serviço.");
      return;
    }

    setFieldErrors({});
    setPending(true);

    const body = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      categoryId: parsed.data.categoryId,
      price: priceToApi(parsed.data.price),
      defaultDurationMinutes: Number(parsed.data.defaultDurationMinutes),
    };

    try {
      if (serviceId) {
        await api(`/api/companies/${companyId}/services/${serviceId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await api(`/api/companies/${companyId}/services`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      router.push("/painel/servicos");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível salvar o serviço.");
    } finally {
      setPending(false);
    }
  }

  async function deactivate() {
    if (!companyId || !serviceId) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      await api(`/api/companies/${companyId}/services/${serviceId}`, { method: "DELETE" });
      router.push("/painel/servicos");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível desativar o serviço.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Link href="/painel/servicos" className="text-sm font-semibold text-[#C8C8D0] hover:text-white">
        Voltar para serviços
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
        {serviceId ? "Editar serviço" : "Cadastrar serviço"}
      </h1>
      <p className="mt-1 text-sm text-[#B7B7C2]">
        O serviço fica ligado a uma subcategoria que a empresa já marcou como atendimento.
      </p>

      {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}

      <form className="scheme-dark mt-6 rounded-2xl border border-white/8 bg-[#141418] p-5" noValidate onSubmit={handleSubmit}>
        <Field
          label="Nome"
          value={name}
          error={fieldErrors.name}
          placeholder="Corte"
          onChange={(value) => {
            setName(value);
            setFieldErrors((current) => ({ ...current, name: undefined }));
          }}
        />
        <label className="mt-4 block text-sm text-[#C8C8D0]">
          Descrição
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setFieldErrors((current) => ({ ...current, description: undefined }));
            }}
            className={`mt-1.5 min-h-24 w-full rounded-xl border bg-[#101014] px-3 py-2 text-sm text-white outline-none focus:border-accent ${
              fieldErrors.description ? "border-[#E5484D]" : "border-white/10"
            }`}
            placeholder="O que entra nesse atendimento"
          />
        </label>
        {fieldErrors.description ? <p className="mt-1.5 text-sm text-[#ff8d90]">{fieldErrors.description}</p> : null}

        <label className="mt-4 block text-sm text-[#C8C8D0]">
          Subcategoria atendida
          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setFieldErrors((current) => ({ ...current, categoryId: undefined }));
            }}
            className={`mt-1.5 h-11 w-full rounded-xl border bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent ${
              fieldErrors.categoryId ? "border-[#E5484D]" : "border-white/10"
            }`}
          >
            <option value="">{categories.length === 0 ? "Nenhuma subcategoria marcada" : "Escolha a subcategoria"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId ? <span className="mt-1.5 block text-sm text-[#ff8d90]">{fieldErrors.categoryId}</span> : null}
          {categoriesError ? <span className="mt-1.5 block text-sm text-[#ff8d90]">{categoriesError}</span> : null}
          {categories.length === 0 && !categoriesError ? (
            <Link href="/painel/categorias" className="mt-1.5 block text-sm font-semibold text-accent hover:underline">
              Marcar o que a empresa atende
            </Link>
          ) : null}
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field
            label="Valor"
            className="mt-0"
            value={price}
            error={fieldErrors.price}
            placeholder="80,00"
            inputMode="numeric"
            maxLength={10}
            onChange={(value) => {
              const next = formatPriceInput(value);
              setPrice(next);
              setFieldErrors((current) => ({
                ...current,
                price: next ? (priceMessage(next) ?? undefined) : undefined,
              }));
            }}
          />
          <Field
            label="Duração padrão (minutos)"
            className="mt-0"
            value={duration}
            error={fieldErrors.defaultDurationMinutes}
            placeholder="45"
            inputMode="numeric"
            maxLength={3}
            onChange={(value) => {
              const next = formatDuration(value);
              setDuration(next);
              setFieldErrors((current) => ({
                ...current,
                defaultDurationMinutes: next ? (durationMessage(next) ?? undefined) : undefined,
              }));
            }}
          />
        </div>

        {error ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || loading}
            className="h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Salvando..." : serviceId ? "Salvar serviço" : "Cadastrar serviço"}
          </button>
          {serviceId ? (
            <button
              type="button"
              disabled={pending}
              className="h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#C8C8D0] hover:bg-white/6 disabled:opacity-60"
              onClick={deactivate}
            >
              Desativar
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  className = "mt-4",
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  className?: string;
}) {
  return (
    <label className={`${className} block text-sm text-[#C8C8D0] first:mt-0`}>
      {label}
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 h-11 w-full rounded-xl border bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent ${
          error ? "border-[#E5484D]" : "border-white/10"
        }`}
      />
      {error ? <span className="mt-1.5 block text-sm text-[#ff8d90]">{error}</span> : null}
    </label>
  );
}
