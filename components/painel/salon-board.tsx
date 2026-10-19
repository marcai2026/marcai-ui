"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ApiError, api } from "@/lib/api";
import { formatBrl } from "@/lib/money";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

const actions = [
  { title: "Novo horário", detail: "Encaixar um cliente na agenda de hoje", href: "/painel/agenda/novo" },
  { title: "Novo cliente", detail: "Guardar o contato para o próximo retorno", href: "/painel/clientes/novo" },
  { title: "Bloquear horário", detail: "Almoço, folga ou cadeira em manutenção", href: "/painel/horarios" },
];

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusLabel: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não veio",
};

type Summary = {
  today: {
    total: number;
    confirmed: number;
    completed: number;
    pending: number;
    cancelled: number;
    noShow: number;
  };
  period: {
    realizedRevenue: string;
    expectedRevenue: string;
    averageTicket: string;
    cancellationRate: number;
  };
  upcomingAppointments: Array<{
    id: string;
    startsAt: string;
    status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
    client: { name: string };
    professional: { id: string; name: string };
    service: { name: string; price: string };
  }>;
};

type AppointmentsReport = {
  dailyTimeline: Array<{ date: string; total: number }>;
};

function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function mondayOf(date: Date) {
  const copy = new Date(date);
  const weekday = copy.getDay();
  const distance = weekday === 0 ? -6 : 1 - weekday;
  copy.setDate(copy.getDate() + distance);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function weekCounts(timeline: Array<{ date: string; total: number }>, monday: Date) {
  const totals = new Map(timeline.map((item) => [item.date, item.total]));
  return Array.from({ length: 6 }, (_, index) => totals.get(isoDate(addDays(monday, index))) ?? 0);
}

function points(values: number[], max: number) {
  const width = 320;
  const height = 120;
  const top = Math.max(max, 1);
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / top) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function SalonBoard({ firstName }: { firstName: string }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [thisWeek, setThisWeek] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [lastWeek, setLastWeek] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [loadedCompanyId, setLoadedCompanyId] = useState<string | null>(null);
  const loading = companyId ? loadedCompanyId !== companyId : true;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    const thisMonday = mondayOf(new Date());
    const lastMonday = addDays(thisMonday, -7);
    const thisSaturday = addDays(thisMonday, 5);
    let active = true;

    Promise.all([
      api<Summary>(`/api/companies/${companyId}/dashboard/summary`),
      api<AppointmentsReport>(
        `/api/companies/${companyId}/dashboard/appointments?startDate=${isoDate(lastMonday)}&endDate=${isoDate(thisSaturday)}`,
      ),
    ])
      .then(([summaryResult, appointmentsResult]) => {
        if (!active) {
          return;
        }
        setSummary(summaryResult);
        setThisWeek(weekCounts(appointmentsResult.dailyTimeline, thisMonday));
        setLastWeek(weekCounts(appointmentsResult.dailyTimeline, lastMonday));
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar o painel.");
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

  const today = summary?.today;
  const period = summary?.period;
  const upcoming = summary?.upcomingAppointments ?? [];
  const team = upcoming.reduce<Array<{ id: string; name: string; next: string }>>((people, item) => {
    if (people.some((person) => person.id === item.professional.id)) {
      return people;
    }
    people.push({
      id: item.professional.id,
      name: item.professional.name,
      next: `${clock(item.startsAt)} · ${item.client.name}`,
    });
    return people;
  }, []);
  const chartMax = Math.max(...thisWeek, ...lastWeek, 1);
  const stats = [
    {
      label: "Agendamentos hoje",
      value: String(today?.total ?? 0),
      hint: today?.completed ? `${today.completed} concluídos` : "Nenhum concluído ainda",
      detail: "Horários do dia",
    },
    {
      label: "Confirmados",
      value: String(today?.confirmed ?? 0),
      hint: `${today?.pending ?? 0} ainda aguardam`,
      detail: "Clientes com horário marcado",
    },
    {
      label: "Receita realizada",
      value: formatBrl(period?.realizedRevenue ?? "0"),
      hint: `Prevista ${formatBrl(period?.expectedRevenue ?? "0")}`,
      detail: "No mês, pelo preço do serviço",
    },
    {
      label: "Ticket médio",
      value: formatBrl(period?.averageTicket ?? "0"),
      hint: `${period?.cancellationRate ?? 0}% cancelados`,
      detail: "Atendimentos concluídos no mês",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Olá, {firstName}</h1>
          <p className="mt-1 text-sm text-[#B7B7C2]">O movimento de hoje no salão.</p>
        </div>
        <Link href="/painel/agenda/novo" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[#062626]">
          Novo horário
        </Link>
      </div>

      {loading ? <p className="text-sm text-[#A7A7B2]">Carregando o painel...</p> : null}
      {error ? <p className="text-sm text-[#ff8d90]">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-white/8 bg-[#141418] p-4">
            <p className="text-sm text-[#A7A7B2]">{stat.label}</p>
            <p className="mt-3 text-[1.7rem] font-semibold leading-none tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-xs font-semibold text-accent">{stat.hint}</p>
            <p className="mt-1 text-xs text-[#8E8E99]">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <article className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Movimento da semana</h2>
              <p className="mt-1 text-sm text-[#A7A7B2]">Horários marcados de segunda a sábado.</p>
            </div>
            <div className="flex gap-4 text-xs text-[#A7A7B2]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Esta semana
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/35" />
                Semana anterior
              </span>
            </div>
          </div>
          <svg viewBox="0 0 320 148" className="mt-4 h-44 w-full" role="img" aria-label="Horários marcados na semana">
            <polyline points={points(lastWeek, chartMax)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <polyline points={points(thisWeek, chartMax)} fill="none" stroke="#00CACA" strokeWidth="2.5" />
            {weekDays.map((day, index) => (
              <text
                key={day}
                x={(index / (weekDays.length - 1)) * 320}
                y="144"
                textAnchor={index === 0 ? "start" : index === weekDays.length - 1 ? "end" : "middle"}
                fill={index === 0 ? "#00CACA" : "#8E8E99"}
                fontSize="11"
              >
                {day}
              </text>
            ))}
          </svg>
        </article>

        <article className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <h2 className="text-base font-semibold text-white">Ações rápidas</h2>
          <p className="mt-1 text-sm text-[#A7A7B2]">O que a recepção faz o tempo todo.</p>
          <ul className="mt-4 space-y-2">
            {actions.map((action) => (
              <li key={action.title}>
                <Link href={action.href} className="block rounded-xl border border-white/8 bg-[#101014] px-3.5 py-3 hover:border-accent/40">
                  <p className="text-sm font-semibold text-white">{action.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#A7A7B2]">{action.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <article className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <h2 className="text-base font-semibold text-white">Próximos horários</h2>
          <p className="mt-1 text-sm text-[#A7A7B2]">Os próximos horários confirmados ou aguardando.</p>
          {upcoming.length === 0 && !loading ? <p className="mt-4 text-sm text-[#A7A7B2]">Nenhum horário à frente.</p> : null}
          <ul className="mt-4 divide-y divide-white/8">
            {upcoming.map((item) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                <Link href={`/painel/agenda/${item.id}`} className="flex flex-wrap items-center gap-3">
                  <span className="w-14 text-sm font-semibold text-accent">{clock(item.startsAt)}</span>
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-semibold text-white">{item.service.name}</p>
                    <p className="text-xs text-[#A7A7B2]">
                      {item.client.name} · {item.professional.name}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs font-semibold text-[#D4D4DC]">
                    {statusLabel[item.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <h2 className="text-base font-semibold text-white">Equipe de hoje</h2>
          <p className="mt-1 text-sm text-[#A7A7B2]">Quem tem o próximo cliente na fila.</p>
          {team.length === 0 && !loading ? <p className="mt-4 text-sm text-[#A7A7B2]">Nenhum profissional com horário à frente.</p> : null}
          <ul className="mt-4 space-y-2">
            {team.map((person) => (
              <li key={person.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#101014] px-3.5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {person.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{person.name}</p>
                  <p className="text-xs text-[#A7A7B2]">{person.next}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
