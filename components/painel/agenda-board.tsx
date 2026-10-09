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

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function clock(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function AgendaBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [date, setDate] = useState(todayKey);
  const [status, setStatus] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Record<string, string>>({});
  const [professionals, setProfessionals] = useState<Named[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    Promise.all([
      api<CustomerList>(`/api/companies/${companyId}/customers?limit=100`),
      api<Named[]>(`/api/companies/${companyId}/services`),
      api<Named[]>(`/api/companies/${companyId}/professionals`),
    ])
      .then(([customerPage, serviceRows, professionalRows]) => {
        if (!active) {
          return;
        }
        setClients(Object.fromEntries(customerPage.data.map((item) => [item.id, item.name])));
        setServices(Object.fromEntries(serviceRows.map((item) => [item.id, item.name])));
        setProfessionals(professionalRows);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar a agenda.");
        }
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    const params = new URLSearchParams({ startDate: date, endDate: date, limit: "100" });
    if (status) {
      params.set("status", status);
    }
    if (professionalId) {
      params.set("professionalId", professionalId);
    }

    setLoading(true);
    api<Appointment[]>(`/api/companies/${companyId}/appointments?${params.toString()}`)
      .then((rows) => {
        if (active) {
          setAppointments(rows);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar os agendamentos.");
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
  }, [companyId, date, professionalId, status]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Agenda</h1>
          <p className="mt-1 text-sm text-[#B7B7C2]">Horários do dia. O fim do atendimento vem da API.</p>
        </div>
        <Link
          href="/painel/agenda/novo"
          className="inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0]"
        >
          Novo agendamento
        </Link>
      </div>

      <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-[#C8C8D0]">
            Dia
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm text-[#C8C8D0]">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
            >
              <option value="">Todos</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#C8C8D0]">
            Profissional
            <select
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
            >
              <option value="">Todos</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? <p className="mt-6 text-sm text-[#A7A7B2]">Carregando...</p> : null}
        {error ? <p className="mt-6 text-sm text-[#ff8d90]">{error}</p> : null}
        {!loading && !error && appointments.length === 0 ? (
          <p className="mt-6 text-sm text-[#A7A7B2]">Nenhum agendamento nesse filtro.</p>
        ) : null}

        {appointments.length > 0 ? (
          <ul className="mt-4 divide-y divide-white/8">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {clock(appointment.startsAt)} – {clock(appointment.endsAt)} · {services[appointment.serviceId] ?? "Serviço"}
                  </p>
                  <p className="text-xs text-[#A7A7B2]">
                    {clients[appointment.clientId] ?? "Cliente"} · {professionals.find((item) => item.id === appointment.professionalId)?.name ?? "Profissional"}
                  </p>
                </div>
                <span className="text-xs text-[#C8C8D0]">{statusLabel[appointment.status]}</span>
                <Link href={`/painel/agenda/${appointment.id}`} className="text-sm font-semibold text-accent hover:underline">
                  Abrir
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
