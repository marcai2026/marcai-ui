"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type DayRow = {
  dayOfWeek: number;
  label: string;
  open: boolean;
  openTime: string;
  closeTime: string;
};

type BusinessHour = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
};

type Professional = {
  id: string;
  name: string;
};

type ScheduleBlock = {
  id: string;
  professionalId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

const week: DayRow[] = [
  { dayOfWeek: 1, label: "Segunda", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 2, label: "Terça", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 3, label: "Quarta", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 4, label: "Quinta", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 5, label: "Sexta", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 6, label: "Sábado", open: true, openTime: "09:00", closeTime: "13:00" },
  { dayOfWeek: 0, label: "Domingo", open: false, openTime: "09:00", closeTime: "13:00" },
];

function clock(value: string) {
  return value.slice(0, 5);
}

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function HoursBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [days, setDays] = useState<DayRow[]>(week);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [professionalId, setProfessionalId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(Boolean(companyId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    Promise.all([
      api<BusinessHour[]>(`/api/companies/${companyId}/business-hours`),
      api<Professional[]>(`/api/companies/${companyId}/professionals`),
      api<ScheduleBlock[]>(`/api/companies/${companyId}/schedule-blocks`),
    ])
      .then(([hours, people, currentBlocks]) => {
        if (!active) {
          return;
        }
        if (hours.length > 0) {
          setDays((rows) =>
            rows.map((row) => {
              const savedHour = hours.find((item) => item.dayOfWeek === row.dayOfWeek);
              if (!savedHour) {
                return { ...row, open: false };
              }
              return {
                ...row,
                open: true,
                openTime: clock(savedHour.openTime),
                closeTime: clock(savedHour.closeTime),
              };
            }),
          );
        }
        setProfessionals(people);
        setBlocks(currentBlocks);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar os horários.");
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

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      return;
    }

    const invalid = days.find((day) => day.open && day.closeTime <= day.openTime);
    if (invalid) {
      setError(`Revise ${invalid.label}. O fechamento precisa ser depois da abertura.`);
      return;
    }

    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await api(`/api/companies/${companyId}/business-hours`, {
        method: "PUT",
        body: JSON.stringify({
          hours: days
            .filter((day) => day.open)
            .map((day) => ({
              dayOfWeek: day.dayOfWeek,
              openTime: day.openTime,
              closeTime: day.closeTime,
            })),
        }),
      });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível salvar o expediente.");
    } finally {
      setPending(false);
    }
  }

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId || !startsAt || !endsAt) {
      setError("Informe o início e o fim do bloqueio.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const created = await api<ScheduleBlock>(`/api/companies/${companyId}/schedule-blocks`, {
        method: "POST",
        body: JSON.stringify({
          professionalId: professionalId || null,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          reason: reason.trim() || null,
        }),
      });
      setBlocks((current) => [created, ...current]);
      setStartsAt("");
      setEndsAt("");
      setReason("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível criar o bloqueio.");
    } finally {
      setPending(false);
    }
  }

  async function removeBlock(blockId: string) {
    if (!companyId) {
      return;
    }

    setError(null);
    try {
      await api(`/api/companies/${companyId}/schedule-blocks/${blockId}`, { method: "DELETE" });
      setBlocks((current) => current.filter((block) => block.id !== blockId));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível remover o bloqueio.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Horários</h1>
        <p className="mt-1 text-sm text-[#B7B7C2]">Expediente da empresa e bloqueios de folga, almoço ou manutenção.</p>
      </div>
      {loading ? <p className="text-sm text-[#A7A7B2]">Carregando...</p> : null}
      {error ? <p className="text-sm text-[#ff8d90]">{error}</p> : null}
      {saved ? <p className="text-sm text-accent">Expediente salvo.</p> : null}

      <form className="rounded-2xl border border-white/8 bg-[#141418] p-5" onSubmit={saveHours}>
        <h2 className="text-base font-semibold text-white">Expediente da empresa</h2>
        <ul className="mt-4 space-y-2">
          {days.map((day) => (
            <li key={day.dayOfWeek} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-[#101014] px-3 py-3">
              <label className="flex min-w-32 items-center gap-2 text-sm font-semibold text-white">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(event) =>
                    setDays((current) =>
                      current.map((item) => (item.dayOfWeek === day.dayOfWeek ? { ...item, open: event.target.checked } : item)),
                    )
                  }
                />
                {day.label}
              </label>
              <input
                type="time"
                disabled={!day.open}
                value={day.openTime}
                onChange={(event) =>
                  setDays((current) =>
                    current.map((item) => (item.dayOfWeek === day.dayOfWeek ? { ...item, openTime: event.target.value } : item)),
                  )
                }
                className="h-10 rounded-lg border border-white/10 bg-[#141418] px-2 text-sm text-white disabled:opacity-40"
              />
              <input
                type="time"
                disabled={!day.open}
                value={day.closeTime}
                onChange={(event) =>
                  setDays((current) =>
                    current.map((item) => (item.dayOfWeek === day.dayOfWeek ? { ...item, closeTime: event.target.value } : item)),
                  )
                }
                className="h-10 rounded-lg border border-white/10 bg-[#141418] px-2 text-sm text-white disabled:opacity-40"
              />
            </li>
          ))}
        </ul>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar expediente"}
        </button>
      </form>

      <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
        <h2 className="text-base font-semibold text-white">Bloqueios</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createBlock}>
          <label className="text-sm text-[#C8C8D0] sm:col-span-2">
            Profissional
            <select
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
            >
              <option value="">Empresa inteira</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#C8C8D0]">
            Início
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm text-[#C8C8D0]">
            Fim
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm text-[#C8C8D0] sm:col-span-2">
            Motivo
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Almoço, folga ou manutenção"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-11 cursor-pointer rounded-xl border border-white/10 px-4 text-sm font-semibold text-white hover:border-white/25 disabled:opacity-60"
          >
            Criar bloqueio
          </button>
        </form>

        <ul className="mt-4 divide-y divide-white/8">
          {blocks.map((block) => {
            const person = professionals.find((item) => item.id === block.professionalId);
            return (
              <li key={block.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {formatWhen(block.startsAt)} – {formatWhen(block.endsAt)}
                  </p>
                  <p className="text-xs text-[#A7A7B2]">
                    {person?.name ?? "Empresa inteira"}
                    {block.reason ? ` · ${block.reason}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-sm font-semibold text-[#C8C8D0] hover:text-white"
                  onClick={() => removeBlock(block.id)}
                >
                  Remover
                </button>
              </li>
            );
          })}
        </ul>
        {blocks.length === 0 && !loading ? <p className="mt-4 text-sm text-[#A7A7B2]">Nenhum bloqueio.</p> : null}
      </section>
    </div>
  );
}
