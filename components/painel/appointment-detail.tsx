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

const statusLabel = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
} as const;

const actions = [
  { action: "confirm", label: "Confirmar" },
  { action: "complete", label: "Concluir" },
  { action: "cancel", label: "Cancelar" },
  { action: "no-show", label: "Não compareceu" },
] as const;

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [names, setNames] = useState({ client: "", service: "", professional: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

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

  async function changeStatus(action: (typeof actions)[number]["action"]) {
    if (!companyId) {
      return;
    }

    setPending(true);
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
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Link href="/painel/agenda" className="text-sm font-semibold text-[#C8C8D0] hover:text-white">
        Voltar para a agenda
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Agendamento</h1>
      {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}
      {error ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}

      {appointment ? (
        <section className="mt-6 rounded-2xl border border-white/8 bg-[#141418] p-5">
          <p className="text-sm font-semibold text-white">{names.service}</p>
          <p className="mt-1 text-sm text-[#B7B7C2]">
            {names.client} · {names.professional}
          </p>
          <p className="mt-3 text-sm text-white">
            {formatWhen(appointment.startsAt)} – {formatWhen(appointment.endsAt)}
          </p>
          <p className="mt-1 text-sm text-[#A7A7B2]">{statusLabel[appointment.status]}</p>
          {appointment.notes ? <p className="mt-3 text-sm text-[#C8C8D0]">{appointment.notes}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {actions.map((item) => (
              <button
                key={item.action}
                type="button"
                disabled={pending}
                className="h-10 cursor-pointer rounded-lg border border-white/10 px-3 text-sm font-semibold text-white hover:border-white/25 disabled:opacity-60"
                onClick={() => changeStatus(item.action)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <h2 className="mt-6 text-sm font-semibold text-white">Histórico</h2>
          {history.length === 0 ? <p className="mt-2 text-sm text-[#A7A7B2]">Sem mudanças de status.</p> : null}
          <ul className="mt-2 space-y-2">
            {history.map((item) => (
              <li key={item.id} className="text-sm text-[#C8C8D0]">
                {formatWhen(item.createdAt)} · {item.fromStatus ? statusLabel[item.fromStatus] : "Início"} → {statusLabel[item.toStatus]}
                {item.reason ? ` · ${item.reason}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
