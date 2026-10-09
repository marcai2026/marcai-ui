"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { z } from "zod";

import { ApiError, api } from "@/lib/api";
import { firstFieldErrors } from "@/lib/auth-schemas";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(100, "O nome pode ter no máximo 100 caracteres.")
    .refine((value) => /\p{L}/u.test(value), "O nome precisa ter letras."),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 0 || digits.length === 10 || digits.length === 11;
    }, "Informe o DDD e o número, com 10 ou 11 dígitos."),
  email: z
    .string()
    .trim()
    .max(254, "O e-mail pode ter no máximo 254 caracteres.")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Informe um e-mail válido."),
  birthDate: z.string().superRefine((value, ctx) => {
    const message = birthDateMessage(value);
    if (message) {
      ctx.addIssue({ code: "custom", message });
    }
  }),
  notes: z.string().trim().max(1000, "As observações podem ter no máximo 1000 caracteres."),
});

type FieldName = "name" | "phone" | "email" | "birthDate" | "notes";

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function birthDateMessage(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return "Informe uma data válida.";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) {
    return "Informe uma data válida.";
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return "A data de nascimento não pode ser no futuro.";
  }
  if (year < 1900) {
    return "Informe um ano a partir de 1900.";
  }

  return null;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) {
    return "";
  }
  if (digits.length < 3) {
    return `(${digits}`;
  }
  if (digits.length < 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length < 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function ClientForm({ customerId }: { customerId?: string }) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(Boolean(customerId));

  useEffect(() => {
    if (!companyId || !customerId) {
      return;
    }

    let active = true;
    api<{ name: string; phone: string | null; email: string | null; birthDate: string | null; notes: string | null }>(
      `/api/companies/${companyId}/customers/${customerId}`,
    )
      .then((customer) => {
        if (!active) {
          return;
        }
        setName(customer.name);
        setPhone(formatPhone(customer.phone ?? ""));
        setEmail(customer.email ?? "");
        setBirthDate(customer.birthDate?.slice(0, 10) ?? "");
        setNotes(customer.notes ?? "");
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar o cliente.");
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
  }, [companyId, customerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = clientSchema.safeParse({ name, phone, email, birthDate, notes });
    if (!parsed.success) {
      setFieldErrors(firstFieldErrors<FieldName>(parsed.error));
      return;
    }

    if (!companyId) {
      setError("Entre em uma empresa para cadastrar o cliente.");
      return;
    }

    setFieldErrors({});
    setPending(true);

    try {
      const body = JSON.stringify({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email.toLowerCase() || null,
        birthDate: parsed.data.birthDate || null,
        notes: parsed.data.notes || null,
      });
      if (customerId) {
        await api(`/api/companies/${companyId}/customers/${customerId}`, { method: "PATCH", body });
      } else {
        await api(`/api/companies/${companyId}/customers`, { method: "POST", body });
      }
      router.push("/painel/clientes");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível salvar o cliente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Link href="/painel/clientes" className="text-sm font-semibold text-[#C8C8D0] hover:text-white">
        Voltar para clientes
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
        {customerId ? "Editar cliente" : "Cadastrar cliente"}
      </h1>
      <p className="mt-1 text-sm text-[#B7B7C2]">A equipe guarda o contato. O cliente ainda não marca sozinho.</p>
      {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}

      <form className="scheme-dark mt-6 rounded-2xl border border-white/8 bg-[#141418] p-5" noValidate onSubmit={handleSubmit}>
        <Field
          label="Nome"
          maxLength={100}
          value={name}
          error={fieldErrors.name}
          placeholder="Marina Costa"
          onChange={(value) => {
            setName(value);
            setFieldErrors((current) => ({ ...current, name: undefined }));
          }}
        />
        <Field
          label="Telefone"
          type="tel"
          inputMode="numeric"
          maxLength={15}
          value={phone}
          error={fieldErrors.phone}
          placeholder="(11) 99999-9999"
          onChange={(value) => {
            setPhone(formatPhone(value));
            setFieldErrors((current) => ({ ...current, phone: undefined }));
          }}
        />
        <Field
          label="E-mail"
          type="email"
          maxLength={254}
          value={email}
          error={fieldErrors.email}
          placeholder="marina@email.com"
          onChange={(value) => {
            setEmail(value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
        />
        <Field
          label="Data de nascimento"
          type="date"
          min="1900-01-01"
          max={todayInputValue()}
          value={birthDate}
          error={fieldErrors.birthDate}
          onChange={(value) => {
            setBirthDate(value);
            setFieldErrors((current) => ({ ...current, birthDate: birthDateMessage(value) ?? undefined }));
          }}
        />
        <label className="mt-4 block text-sm text-[#C8C8D0]">
          Observações
          <textarea
            maxLength={1000}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setFieldErrors((current) => ({ ...current, notes: undefined }));
            }}
            className={`mt-1.5 min-h-24 w-full rounded-xl border bg-[#101014] px-3 py-2 text-sm text-white outline-none focus:border-accent ${
              fieldErrors.notes ? "border-[#E5484D]" : "border-white/10"
            }`}
            placeholder="Preferências, alergias ou um recado da recepção"
          />
        </label>
        {fieldErrors.notes ? <p className="mt-1.5 text-sm text-[#ff8d90]">{fieldErrors.notes}</p> : null}

        {error ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || loading}
            className="h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Salvando..." : customerId ? "Salvar cliente" : "Cadastrar cliente"}
          </button>
          {customerId ? (
            <button
              type="button"
              disabled={pending}
              className="h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#C8C8D0] hover:bg-white/6 disabled:opacity-60"
              onClick={async () => {
                if (!companyId) {
                  return;
                }
                setPending(true);
                setError(null);
                try {
                  await api(`/api/companies/${companyId}/customers/${customerId}`, { method: "DELETE" });
                  router.push("/painel/clientes");
                } catch (caught) {
                  setError(caught instanceof ApiError ? caught.message : "Não foi possível arquivar o cliente.");
                  setPending(false);
                }
              }}
            >
              Arquivar
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
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  min,
  max,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  min?: string;
  max?: string;
}) {
  return (
    <label className="mt-4 block text-sm text-[#C8C8D0] first:mt-0">
      {label}
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
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
