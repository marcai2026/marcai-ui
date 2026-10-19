"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Appointment = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  startsAt: string;
  endsAt: string;
  notes: string | null;
};

type HistoryItem = {
  id: string;
  fromStatus: Appointment["status"] | null;
  toStatus: Appointment["status"];
  reason: string | null;
  createdAt: string;
};

type Named = { id: string; name: string };
type CustomerList = { data: Named[] };
type StatusAction = "confirm" | "complete" | "cancel" | "no-show";
type Slot = { startsAt: string; endsAt: string; formattedTime: string };

const statusLabel = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
} as const;

const statusTone = {
  pending: "bg-[#F5A524]/15 text-[#F5A524]",
  confirmed: "bg-accent/15 text-accent",
  completed: "bg-[#3DDC97]/15 text-[#3DDC97]",
  cancelled: "bg-[#E5484D]/15 text-[#ff8d90]",
  no_show: "bg-white/8 text-[#C8C8D0]",
} as const;

const nextActions: Record<Appointment["status"], { action: StatusAction; label: string; tone: "primary" | "quiet" | "danger" }[]> = {
  pending: [
    { action: "confirm", label: "Confirmar", tone: "primary" },
    { action: "cancel", label: "Cancelar", tone: "danger" },
  ],
  confirmed: [
    { action: "complete", label: "Concluir", tone: "primary" },
    { action: "no-show", label: "Não compareceu", tone: "quiet" },
    { action: "cancel", label: "Cancelar", tone: "danger" },
  ],
  completed: [],
  cancelled: [],
  no_show: [],
};

function formatDate(value: string) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function dateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function appointmentDateMessage(value: string) {
  if (!value) {
    return "Escolha a data.";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
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
  if (value < todayKey()) {
    return "Escolha hoje ou uma data futura.";
  }

  return null;
}

function durationLabel(startsAt: string, endsAt: string) {
  const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000);
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [names, setNames] = useState({ client: "", service: "", professional: "" });
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(todayKey);
  const [rescheduleDateError, setRescheduleDateError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [nextStartsAt, setNextStartsAt] = useState("");
  const [loadedSlotKey, setLoadedSlotKey] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const slotKey = `${companyId ?? ""}:${appointment?.serviceId ?? ""}:${appointment?.professionalId ?? ""}:${rescheduleDate}:${appointmentId}`;
  const slotsLoading = rescheduleOpen && !appointmentDateMessage(rescheduleDate) && loadedSlotKey !== slotKey;

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    Promise.all([
      api<Appointment>(`/api/companies/${companyId}/appointments/${appointmentId}`),
      api<HistoryItem[]>(`/api/companies/${companyId}/appointments/${appointmentId}/history`),
      api<CustomerList>(`/api/companies/${companyId}/customers?limit=100`),
      api<Named[]>(`/api/companies/${companyId}/services`),
      api<Named[]>(`/api/companies/${companyId}/professionals`),
    ])
      .then(([current, historyRows, customers, services, professionals]) => {
        if (!active) {
          return;
        }
        setAppointment(current);
        setHistory(historyRows);
        setNames({
          client: customers.data.find((item) => item.id === current.clientId)?.name ?? "Cliente",
          service: services.find((item) => item.id === current.serviceId)?.name ?? "Serviço",
          professional: professionals.find((item) => item.id === current.professionalId)?.name ?? "Profissional",
        });
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível abrir o agendamento.");
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
  }, [appointmentId, companyId]);

  async function changeStatus(action: StatusAction) {
    if (!companyId) {
      return;
    }

    setPendingAction(action);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/companies/${companyId}/appointments/${appointmentId}/${action}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const historyRows = await api<HistoryItem[]>(`/api/companies/${companyId}/appointments/${appointmentId}/history`);
      setAppointment(updated);
      setHistory(historyRows);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível atualizar o status.");
    } finally {
      setPendingAction(null);
    }
  }

  useEffect(() => {
    if (!rescheduleOpen || !companyId || !appointment || appointmentDateMessage(rescheduleDate)) {
      return;
    }

    let active = true;
    const params = new URLSearchParams({
      serviceId: appointment.serviceId,
      professionalId: appointment.professionalId,
      date: rescheduleDate,
      excludeAppointmentId: appointmentId,
    });

    api<Slot[]>(`/api/companies/${companyId}/availability?${params.toString()}`)
      .then((rows) => {
        if (active) {
          setSlots(rows);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setSlots([]);
          setError(caught instanceof ApiError ? caught.message : "Não foi possível consultar os horários livres.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadedSlotKey(slotKey);
        }
      });

    return () => {
      active = false;
    };
  }, [appointment, appointmentId, companyId, rescheduleDate, rescheduleOpen, slotKey]);

  function openReschedule() {
    if (!appointment) {
      return;
    }

    const current = dateKey(appointment.startsAt);
    setRescheduleDate(current < todayKey() ? todayKey() : current);
    setRescheduleDateError(null);
    setNextStartsAt("");
    setSlots([]);
    setLoadedSlotKey(null);
    setRescheduleOpen(true);
  }

  async function saveReschedule() {
    if (!companyId || !nextStartsAt) {
      setError("Escolha um horário livre.");
      return;
    }

    const invalidDate = appointmentDateMessage(rescheduleDate);
    if (invalidDate) {
      setRescheduleDateError(invalidDate);
      return;
    }

    setSavingSchedule(true);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/companies/${companyId}/appointments/${appointmentId}/reschedule`, {
        method: "POST",
        body: JSON.stringify({ startsAt: nextStartsAt }),
      });
      const historyRows = await api<HistoryItem[]>(`/api/companies/${companyId}/appointments/${appointmentId}/history`);
      setAppointment(updated);
      setHistory(historyRows);
      setRescheduleOpen(false);
      setNextStartsAt("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível reagendar.");
    } finally {
      setSavingSchedule(false);
    }
  }

  const actions = appointment ? nextActions[appointment.status] : [];
  const canReschedule = appointment?.status === "pending" || appointment?.status === "confirmed";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/painel/agenda" className="text-sm font-semibold text-[#C8C8D0] hover:text-white">
        Voltar para a agenda
      </Link>

      {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}
      {!loading && error && !appointment ? <p className="mt-6 text-sm text-[#ff8d90]">{error}</p> : null}

      {appointment ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{names.service}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[appointment.status]}`}>
              {statusLabel[appointment.status]}
            </span>
          </div>

          <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
            <p className="text-xs font-semibold tracking-wide text-[#8E8E99] uppercase">Quando</p>
            <p className="mt-2 text-xl font-semibold text-white">{formatDate(appointment.startsAt)}</p>
            <p className="mt-1 text-lg text-accent">
              {formatTime(appointment.startsAt)} – {formatTime(appointment.endsAt)}
            </p>
            <p className="mt-1 text-sm text-[#A7A7B2]">{durationLabel(appointment.startsAt, appointment.endsAt)}</p>
          </section>

          <section className="rounded-2xl border border-white/8 bg-[#141418] px-5 py-2">
            <DetailRow label="Cliente" value={names.client} />
            <DetailRow label="Profissional" value={names.professional} />
            <DetailRow label="Serviço" value={names.service} />
            {appointment.notes ? (
              <div className="border-t border-white/8 py-3">
                <p className="text-sm text-[#A7A7B2]">Observações</p>
                <p className="mt-1 text-sm leading-6 text-white">{appointment.notes}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
            <h2 className="text-sm font-semibold text-white">Status</h2>
            {actions.length > 0 || canReschedule ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    disabled={pendingAction !== null || savingSchedule}
                    className={actionClass(item.tone)}
                    onClick={() => changeStatus(item.action)}
                  >
                    {pendingAction === item.action ? "Salvando..." : item.label}
                  </button>
                ))}
                {canReschedule ? (
                  <button
                    type="button"
                    disabled={pendingAction !== null || savingSchedule}
                    className={actionClass("quiet")}
                    onClick={() => (rescheduleOpen ? setRescheduleOpen(false) : openReschedule())}
                  >
                    Reagendar
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#A7A7B2]">Este agendamento não aceita mais mudanças.</p>
            )}
            {rescheduleOpen ? (
              <div className="scheme-dark mt-5 border-t border-white/8 pt-5">
                <p className="text-sm text-[#C8C8D0]">Novo horário</p>
                <label className="mt-3 block text-sm text-[#C8C8D0]">
                  Data
                  <input
                    type="date"
                    min={todayKey()}
                    value={rescheduleDate}
                    onChange={(event) => {
                      const next = event.target.value;
                      setRescheduleDate(next);
                      setRescheduleDateError(appointmentDateMessage(next));
                      setNextStartsAt("");
                      setSlots([]);
                      setLoadedSlotKey(null);
                    }}
                    className={`mt-1.5 h-11 w-full rounded-xl border bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent ${
                      rescheduleDateError ? "border-[#E5484D]" : "border-white/10"
                    }`}
                  />
                  {rescheduleDateError ? <span className="mt-1.5 block text-sm text-[#ff8d90]">{rescheduleDateError}</span> : null}
                </label>
                <div className="mt-4">
                  <p className="text-sm text-[#C8C8D0]">Horário livre</p>
                  {slotsLoading ? <p className="mt-2 text-sm text-[#A7A7B2]">Consultando a disponibilidade...</p> : null}
                  {!slotsLoading && !rescheduleDateError && slots.length === 0 ? (
                    <p className="mt-2 text-sm text-[#A7A7B2]">Nenhum horário livre nessa data.</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.startsAt}
                        type="button"
                        aria-pressed={nextStartsAt === slot.startsAt}
                        className={`h-10 cursor-pointer rounded-lg px-3 text-sm font-semibold ${
                          nextStartsAt === slot.startsAt ? "bg-accent text-[#062626]" : "border border-white/10 text-white"
                        }`}
                        onClick={() => setNextStartsAt(slot.startsAt)}
                      >
                        {slot.formattedTime}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={savingSchedule || !nextStartsAt}
                  className="mt-4 h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={saveReschedule}
                >
                  {savingSchedule ? "Salvando..." : "Salvar novo horário"}
                </button>
              </div>
            ) : null}
            {error ? <p className="mt-3 text-sm text-[#ff8d90]">{error}</p> : null}
          </section>

          <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
            <h2 className="text-sm font-semibold text-white">Histórico</h2>
            {history.length === 0 ? <p className="mt-2 text-sm text-[#A7A7B2]">Sem mudanças de status.</p> : null}
            <ol className="mt-4">
              {history.map((item, index) => (
                <li key={item.id} className="relative pb-5 pl-6 last:pb-0">
                  {index < history.length - 1 ? <span className="absolute top-2 left-0.75 h-full w-px bg-white/10" /> : null}
                  <span className="absolute top-1.5 left-0 size-2 rounded-full bg-accent" />
                  <p className="text-sm font-semibold text-white">
                    {item.reason?.startsWith("Reagendado") ? item.reason : statusLabel[item.toStatus]}
                  </p>
                  <p className="mt-0.5 text-xs text-[#A7A7B2]">
                    {formatWhen(item.createdAt)}
                    {item.fromStatus && item.fromStatus !== item.toStatus ? ` · antes era ${statusLabel[item.fromStatus]}` : ""}
                  </p>
                  {item.reason && !item.reason.startsWith("Reagendado") ? (
                    <p className="mt-1 text-sm text-[#C8C8D0]">{item.reason}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/8 py-3 first:border-t-0">
      <span className="text-sm text-[#A7A7B2]">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function actionClass(tone: "primary" | "quiet" | "danger") {
  if (tone === "primary") {
    return "h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60";
  }
  if (tone === "danger") {
    return "h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#ff8d90] hover:bg-[#E5484D]/10 disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "h-11 cursor-pointer rounded-xl border border-white/10 px-4 text-sm font-semibold text-white hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-60";
}
