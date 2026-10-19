"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { z } from "zod";

import { ApiError, api } from "@/lib/api";
import { firstFieldErrors } from "@/lib/auth-schemas";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

const professionalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(100, "O nome pode ter no máximo 100 caracteres."),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 0 || digits.length === 10 || digits.length === 11;
    }, "Informe o DDD e o número, com 10 ou 11 dígitos."),
  bio: z.string().trim().max(1000, "A bio pode ter no máximo 1000 caracteres."),
  photoUrl: z.string().trim().superRefine((value, ctx) => {
    const message = photoUrlMessage(value);
    if (message) {
      ctx.addIssue({ code: "custom", message });
    }
  }),
});

type FieldName = "name" | "phone" | "bio" | "photoUrl";

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

type CatalogService = {
  id: string;
  name: string;
  price: string;
  defaultDurationMinutes: number;
  category: { id: string; name: string } | null;
};

type AssignedService = {
  serviceId: string;
};

type ServiceLink = {
  selected: boolean;
};

type Shift = {
  startsAt: string;
  endsAt: string;
};

type HourRow = {
  weekday: number;
  label: string;
  open: boolean;
  shifts: Shift[];
};

type Professional = {
  name: string;
  phone: string | null;
  bio: string | null;
  photoUrl: string | null;
};

type ProfessionalHour = {
  weekday: number;
  startsAt: string | null;
  endsAt: string | null;
  isUnavailable: boolean;
};

const weekSeed: HourRow[] = [
  { weekday: 1, label: "Segunda", open: false, shifts: [{ startsAt: "09:00", endsAt: "18:00" }] },
  { weekday: 2, label: "Terça", open: false, shifts: [{ startsAt: "09:00", endsAt: "18:00" }] },
  { weekday: 3, label: "Quarta", open: false, shifts: [{ startsAt: "09:00", endsAt: "18:00" }] },
  { weekday: 4, label: "Quinta", open: false, shifts: [{ startsAt: "09:00", endsAt: "18:00" }] },
  { weekday: 5, label: "Sexta", open: false, shifts: [{ startsAt: "09:00", endsAt: "18:00" }] },
  { weekday: 6, label: "Sábado", open: false, shifts: [{ startsAt: "09:00", endsAt: "13:00" }] },
  { weekday: 0, label: "Domingo", open: false, shifts: [{ startsAt: "09:00", endsAt: "13:00" }] },
];

function hoursFromSaved(savedHours: ProfessionalHour[]) {
  return weekSeed.map((row) => {
    const shifts = savedHours
      .filter((item) => item.weekday === row.weekday && !item.isUnavailable && item.startsAt && item.endsAt)
      .map((item) => ({ startsAt: clock(item.startsAt), endsAt: clock(item.endsAt) }))
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt));

    if (shifts.length === 0) {
      return { ...row, open: false };
    }

    return { ...row, open: true, shifts };
  });
}

function withExtraShift(shifts: Shift[]) {
  if (shifts.length >= 3) {
    return shifts;
  }

  const first = shifts[0];
  if (shifts.length === 1 && first && first.startsAt < "12:00" && first.endsAt > "13:00") {
    return [
      { startsAt: first.startsAt, endsAt: "12:00" },
      { startsAt: "13:00", endsAt: first.endsAt },
    ];
  }

  return [...shifts, { startsAt: "13:00", endsAt: "18:00" }];
}

function hourError(row: HourRow) {
  if (!row.open) {
    return null;
  }

  const shifts = [...row.shifts].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  if (shifts.some((shift) => !shift.startsAt || !shift.endsAt || shift.endsAt <= shift.startsAt)) {
    return `Revise o horário de ${row.label}. O fim precisa ser depois do início.`;
  }

  for (let index = 1; index < shifts.length; index += 1) {
    if (shifts[index].startsAt < shifts[index - 1].endsAt) {
      return `Os turnos de ${row.label} se cruzam. Deixe o almoço entre o fim de um e o início do outro.`;
    }
  }

  return null;
}

function clock(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

export function ProfessionalForm({ professionalId }: { professionalId?: string }) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [links, setLinks] = useState<Record<string, ServiceLink>>({});
  const [hours, setHours] = useState<HourRow[]>(weekSeed);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(Boolean(professionalId));

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    const servicesRequest = api<CatalogService[]>(`/api/companies/${companyId}/services`);
    const assignedRequest = professionalId
      ? api<AssignedService[]>(`/api/companies/${companyId}/professionals/${professionalId}/services`)
      : Promise.resolve([] as AssignedService[]);
    const profileRequest = professionalId
      ? api<Professional>(`/api/companies/${companyId}/professionals/${professionalId}`)
      : Promise.resolve(null);
    const hoursRequest = professionalId
      ? api<ProfessionalHour[]>(`/api/companies/${companyId}/professionals/${professionalId}/hours`)
      : Promise.resolve([] as ProfessionalHour[]);

    Promise.all([servicesRequest, assignedRequest, profileRequest, hoursRequest])
      .then(([services, assigned, profile, savedHours]) => {
        if (!active) {
          return;
        }

        setCatalog(services);
        setLinks(
          Object.fromEntries(
            services.map((service) => {
              const current = assigned.find((item) => item.serviceId === service.id);
              return [
                service.id,
                {
                  selected: Boolean(current),
                },
              ];
            }),
          ),
        );

        if (profile) {
          setName(profile.name);
          setPhone(formatPhone(profile.phone ?? ""));
          setBio(profile.bio ?? "");
          setPhotoUrl(profile.photoUrl ?? "");
        }

        if (savedHours.length > 0) {
          setHours(hoursFromSaved(savedHours));
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar o profissional.");
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
  }, [companyId, professionalId]);

  function updateLink(serviceId: string, patch: Partial<ServiceLink>) {
    setLinks((current) => ({
      ...current,
      [serviceId]: { ...current[serviceId], ...patch },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = professionalSchema.safeParse({ name, phone, bio, photoUrl });
    if (!parsed.success) {
      setFieldErrors(firstFieldErrors<FieldName>(parsed.error));
      return;
    }

    if (!companyId) {
      setError("Entre em uma empresa para cadastrar o profissional.");
      return;
    }

    const selected = catalog.filter((service) => links[service.id]?.selected);

    const invalidHour = hours.map(hourError).find((message) => message);
    if (invalidHour) {
      setError(invalidHour);
      return;
    }

    setFieldErrors({});
    setPending(true);

    const profile = {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio || null,
      photoUrl: parsed.data.photoUrl || null,
    };

    try {
      const saved = professionalId
        ? await api<{ id: string }>(`/api/companies/${companyId}/professionals/${professionalId}`, {
            method: "PATCH",
            body: JSON.stringify(profile),
          })
        : await api<{ id: string }>(`/api/companies/${companyId}/professionals`, {
            method: "POST",
            body: JSON.stringify(profile),
          });

      await api(`/api/companies/${companyId}/professionals/${saved.id}/services`, {
        method: "PUT",
        body: JSON.stringify({
          services: selected.map((service) => ({
            serviceId: service.id,
            price: Number(service.price).toFixed(2),
            durationMinutes: service.defaultDurationMinutes,
          })),
        }),
      });

      await api(`/api/companies/${companyId}/professionals/${saved.id}/hours`, {
        method: "PUT",
        body: JSON.stringify({
          hours: hours.flatMap((row): { weekday: number; isUnavailable: boolean; startsAt: string | null; endsAt: string | null }[] => {
            if (!row.open) {
              return [{ weekday: row.weekday, isUnavailable: true, startsAt: null, endsAt: null }];
            }

            return [...row.shifts]
              .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
              .map((shift) => ({
                weekday: row.weekday,
                isUnavailable: false,
                startsAt: shift.startsAt,
                endsAt: shift.endsAt,
              }));
          }),
        }),
      });

      router.push("/painel/profissionais");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível salvar o profissional.");
    } finally {
      setPending(false);
    }
  }

  async function deactivate() {
    if (!companyId || !professionalId) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      await api(`/api/companies/${companyId}/professionals/${professionalId}`, { method: "DELETE" });
      router.push("/painel/profissionais");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível desativar o profissional.");
      setPending(false);
    }
  }

  const grouped = catalog.reduce<Record<string, CatalogService[]>>((groups, service) => {
    const label = service.category?.name ?? "Sem subcategoria";
    groups[label] = [...(groups[label] ?? []), service];
    return groups;
  }, {});

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/painel/profissionais" className="text-sm font-semibold text-[#C8C8D0] hover:text-white">
        Voltar para profissionais
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
        {professionalId ? "Editar profissional" : "Cadastrar profissional"}
      </h1>
      <p className="mt-1 text-sm text-[#B7B7C2]">
        Nome, telefone e os serviços que esta pessoa executa. Valor e duração ficam no cadastro do serviço.
      </p>

      {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}

      <form className="scheme-dark mt-6 flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <Field
            label="Nome"
            value={name}
            error={fieldErrors.name}
            placeholder="Camila Souza"
            onChange={(value) => {
              setName(value);
              setFieldErrors((current) => ({ ...current, name: undefined }));
            }}
          />
          <Field
            label="Telefone"
            value={phone}
            error={fieldErrors.phone}
            placeholder="(11) 99999-9999"
            inputMode="numeric"
            maxLength={15}
            onChange={(value) => {
              setPhone(formatPhone(value));
              setFieldErrors((current) => ({ ...current, phone: undefined }));
            }}
          />
          <label className="mt-4 block text-sm text-[#C8C8D0]">
            Bio
            <textarea
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                setFieldErrors((current) => ({ ...current, bio: undefined }));
              }}
              className={`mt-1.5 min-h-24 w-full rounded-xl border bg-[#101014] px-3 py-2 text-sm text-white outline-none focus:border-accent ${
                fieldErrors.bio ? "border-[#E5484D]" : "border-white/10"
              }`}
              placeholder="Especialidades e um resumo curto"
            />
          </label>
          {fieldErrors.bio ? <p className="mt-1.5 text-sm text-[#ff8d90]">{fieldErrors.bio}</p> : null}
          <Field
            label="Foto (endereço)"
            value={photoUrl}
            error={fieldErrors.photoUrl}
            placeholder="https://"
            onChange={(value) => {
              setPhotoUrl(value);
              setFieldErrors((current) => ({ ...current, photoUrl: photoUrlMessage(value) ?? undefined }));
            }}
          />
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <h2 className="text-base font-semibold text-white">Serviços que executa</h2>
          <p className="mt-1 text-sm text-[#A7A7B2]">Cada serviço já pertence a uma subcategoria marcada pela empresa.</p>
          {catalog.length === 0 ? (
            <p className="mt-4 text-sm text-[#A7A7B2]">
              Nenhum serviço ativo.{" "}
              <Link href="/painel/servicos/novo" className="font-semibold text-accent hover:underline">
                Cadastre um serviço
              </Link>
              .
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {Object.entries(grouped).map(([categoryName, services]) => (
                <div key={categoryName}>
                  <p className="text-xs font-semibold tracking-wide text-[#8E8E99] uppercase">{categoryName}</p>
                  <ul className="mt-2 space-y-2">
                    {services.map((service) => {
                      const link = links[service.id];
                      return (
                        <li key={service.id} className="rounded-xl border border-white/8 bg-[#101014] px-3 py-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-white">
                            <input
                              type="checkbox"
                              checked={link?.selected ?? false}
                              onChange={(event) => updateLink(service.id, { selected: event.target.checked })}
                            />
                            {service.name}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <h2 className="text-base font-semibold text-white">Expediente</h2>
          <p className="mt-1 text-sm text-[#A7A7B2]">Dois turnos no mesmo dia deixam o almoço no intervalo.</p>
          <ul className="mt-4 space-y-2">
            {hours.map((row) => (
              <li key={row.weekday} className="rounded-xl border border-white/8 bg-[#101014] px-3 py-3">
                <label className="flex min-w-32 items-center gap-2 text-sm font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={row.open}
                    onChange={(event) =>
                      setHours((current) =>
                        current.map((item) => (item.weekday === row.weekday ? { ...item, open: event.target.checked } : item)),
                      )
                    }
                  />
                  {row.label}
                </label>
                {row.open ? (
                  <div className="mt-3 space-y-2">
                    {row.shifts.map((shift, index) => (
                      <div key={`${row.weekday}-${index}`} className="flex flex-wrap items-center gap-3">
                        <span className="w-16 text-xs text-[#A7A7B2]">Turno {index + 1}</span>
                        <input
                          type="time"
                          value={shift.startsAt}
                          onChange={(event) =>
                            setHours((current) =>
                              current.map((item) =>
                                item.weekday === row.weekday
                                  ? {
                                      ...item,
                                      shifts: item.shifts.map((currentShift, shiftIndex) =>
                                        shiftIndex === index ? { ...currentShift, startsAt: event.target.value } : currentShift,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="h-10 rounded-lg border border-white/10 bg-[#141418] px-2 text-sm text-white"
                        />
                        <input
                          type="time"
                          value={shift.endsAt}
                          onChange={(event) =>
                            setHours((current) =>
                              current.map((item) =>
                                item.weekday === row.weekday
                                  ? {
                                      ...item,
                                      shifts: item.shifts.map((currentShift, shiftIndex) =>
                                        shiftIndex === index ? { ...currentShift, endsAt: event.target.value } : currentShift,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="h-10 rounded-lg border border-white/10 bg-[#141418] px-2 text-sm text-white"
                        />
                        {row.shifts.length > 1 ? (
                          <button
                            type="button"
                            className="cursor-pointer text-sm font-semibold text-[#C8C8D0] hover:text-white"
                            onClick={() =>
                              setHours((current) =>
                                current.map((item) =>
                                  item.weekday === row.weekday
                                    ? { ...item, shifts: item.shifts.filter((_, shiftIndex) => shiftIndex !== index) }
                                    : item,
                                ),
                              )
                            }
                          >
                            Remover
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {row.shifts.length < 3 ? (
                      <button
                        type="button"
                        className="cursor-pointer text-sm font-semibold text-accent hover:underline"
                        onClick={() =>
                          setHours((current) =>
                            current.map((item) =>
                              item.weekday === row.weekday ? { ...item, shifts: withExtraShift(item.shifts) } : item,
                            ),
                          )
                        }
                      >
                        Adicionar turno
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {error ? <p className="text-sm text-[#ff8d90]">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || loading}
            className="h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Salvando..." : professionalId ? "Salvar profissional" : "Cadastrar profissional"}
          </button>
          {professionalId ? (
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
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
}) {
  return (
    <label className="mt-4 block text-sm text-[#C8C8D0] first:mt-0">
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
