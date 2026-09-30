"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { MarcaiLogo } from "@/components/brand/marcai-logo";
import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, readCompanyId, saveSession, subscribeSession } from "@/lib/session";

const steps = [
  { label: "Empresa", hint: "O nome que o cliente vê" },
  { label: "Ramo", hint: "A categoria do negócio" },
  { label: "Equipe", hint: "Quantas pessoas atendem" },
  { label: "Horário", hint: "Quando a casa abre" },
];

const businessSegments = [
  { id: "estetica", label: "Estética e beleza", detail: "Clínica, studio e procedimentos" },
  { id: "barbearia", label: "Barbearia", detail: "Corte, barba e cuidados" },
  { id: "salao", label: "Salão de beleza", detail: "Cabelo, unhas e maquiagem" },
  { id: "pet", label: "Pet", detail: "Banho, tosa e consulta" },
  { id: "saude", label: "Saúde", detail: "Consultas e clínicas" },
  { id: "automotivo", label: "Automotivo", detail: "Oficina e estética automotiva" },
  { id: "bem-estar", label: "Bem-estar", detail: "Massagem, spa e terapias" },
  { id: "educacao", label: "Educação", detail: "Aulas e horários marcados" },
];

const teamSizes = [
  { id: "1", label: "Só eu", detail: "Uma agenda", marks: 1 },
  { id: "2-5", label: "2 a 5", detail: "Time pequeno", marks: 3 },
  { id: "6-15", label: "6 a 15", detail: "Várias cadeiras", marks: 5 },
  { id: "16+", label: "Mais de 15", detail: "Casa cheia", marks: 7 },
];

const week = [
  { dayOfWeek: 1, short: "Seg", label: "Segunda", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 2, short: "Ter", label: "Terça", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 3, short: "Qua", label: "Quarta", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 4, short: "Qui", label: "Quinta", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 5, short: "Sex", label: "Sexta", open: true, openTime: "09:00", closeTime: "18:00" },
  { dayOfWeek: 6, short: "Sáb", label: "Sábado", open: true, openTime: "09:00", closeTime: "13:00" },
  { dayOfWeek: 0, short: "Dom", label: "Domingo", open: false, openTime: "09:00", closeTime: "18:00" },
];

type DayHour = (typeof week)[number];

function subscribeReady() {
  return () => {};
}

function ChairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 2.5A1.5 1.5 0 0 1 9.5 1h5A1.5 1.5 0 0 1 16 2.5V8H8V2.5ZM6.5 9A1.5 1.5 0 0 0 5 10.5V13h14v-2.5A1.5 1.5 0 0 0 17.5 9h-11ZM11 14h2v5h3.25a1 1 0 1 1 0 2h-8.5a1 1 0 1 1 0-2H11v-5Z"
      />
    </svg>
  );
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

function daySpan(openTime: string, closeTime: string) {
  const start = 6 * 60;
  const end = 22 * 60;
  const open = Math.min(Math.max(minutes(openTime), start), end);
  const close = Math.min(Math.max(minutes(closeTime), start), end);
  const left = ((open - start) / (end - start)) * 100;
  const width = Math.max(((close - open) / (end - start)) * 100, 4);
  return { left: `${left}%`, width: `${width}%` };
}

export function OnboardingWizard() {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [segment, setSegment] = useState<string | null>(null);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState("2-5");
  const [hours, setHours] = useState<DayHour[]>(week);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.companyId) {
      router.replace("/painel");
    }
  }, [ready, router, session]);

  function updateDay(dayOfWeek: number, patch: Partial<DayHour>) {
    setHoursError(null);
    setHours((current) => current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)));
  }

  function nextStep() {
    if (step === 0 && companyName.trim().length < 2) {
      setNameError("O nome precisa ter pelo menos 2 caracteres.");
      return;
    }

    if (step === 1 && !segment) {
      setSegmentError("Escolha a categoria do negócio.");
      return;
    }

    if (step === 2 && !teamSize) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function finish() {
    const openDays = hours.filter((day) => day.open);

    if (openDays.length === 0) {
      setHoursError("Marque pelo menos um dia de funcionamento.");
      return;
    }

    const invalidDay = openDays.find((day) => day.closeTime <= day.openTime);
    if (invalidDay) {
      setHoursError(`${invalidDay.label} precisa fechar depois de abrir.`);
      return;
    }

    if (!session) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      let accessToken = session.accessToken;
      let companyId = session.companyId;

      if (!companyId) {
        try {
          const created = await api<{ accessToken: string; companyId: string }>("/api/onboarding/onboarding", {
            method: "POST",
            body: JSON.stringify({ companyName: companyName.trim() }),
          });

          accessToken = created.accessToken;
          companyId = readCompanyId(created.accessToken) ?? created.companyId;
        } catch (caught) {
          if (!(caught instanceof ApiError) || caught.status !== 409) {
            throw caught;
          }

          const companies = await api<Array<{ id: string }>>("/api/companies");
          companyId = companies[0]?.id ?? null;

          if (!companyId) {
            throw caught;
          }
        }
      }

      const auth = { Authorization: `Bearer ${accessToken}` };

      await api(`/api/companies/${companyId}/business-hours`, {
        method: "PUT",
        headers: auth,
        body: JSON.stringify({
          hours: openDays.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            openTime: day.openTime,
            closeTime: day.closeTime,
          })),
        }),
      });

      saveSession(
        {
          accessToken,
          user: session.user,
          companyId,
        },
        true,
      );

      router.push("/painel");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível concluir o cadastro.");
    } finally {
      setPending(false);
    }
  }

  if (!ready || !session || session.companyId) {
    return <main className="flex flex-1 items-center justify-center bg-[#070708] text-[#A7A7B2]">Carregando...</main>;
  }

  const nextLabel = steps[step + 1]?.label;

  return (
    <main className="relative flex min-h-full flex-1 overflow-x-hidden overflow-y-auto bg-[#070708] text-white">
      <div className="ambient-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8 lg:py-10">
        <aside className="lg:w-72 lg:shrink-0">
          <MarcaiLogo variant="light" className="h-8 w-auto" />
          <p className="mt-8 hidden text-sm leading-6 text-[#C8C8D0] lg:block">
            Quatro passos para abrir a agenda. Você volta em qualquer etapa já feita.
          </p>
          <ol className="mt-6 flex gap-3 overflow-x-auto lg:mt-10 lg:flex-col lg:gap-0 lg:overflow-visible">
            {steps.map((item, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <li key={item.label} className="flex shrink-0 items-stretch lg:min-h-20">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      disabled={!done}
                      aria-current={current ? "step" : undefined}
                      className={`grid size-9 place-items-center rounded-full border text-sm font-semibold ${
                        current
                          ? "border-accent bg-accent text-[#062626]"
                          : done
                            ? "cursor-pointer border-accent/40 bg-accent/15 text-accent"
                            : "border-white/15 text-[#8E8E99]"
                      }`}
                      onClick={() => setStep(index)}
                    >
                      {done ? (
                        <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                          <path
                            d="M3.5 8.2 6.4 11l6.1-6.2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </button>
                    {index < steps.length - 1 ? (
                      <span
                        className={`my-1 hidden w-px flex-1 lg:block ${done ? "bg-accent/70" : "bg-white/10"}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className="ml-3 hidden pb-6 lg:block">
                    <p className={`text-sm font-semibold ${current || done ? "text-white" : "text-[#8E8E99]"}`}>
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8E8E99]">{item.hint}</p>
                  </div>
                  <span className="ml-2 self-center text-xs font-semibold text-[#C8C8D0] lg:hidden">{item.label}</span>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col rounded-3xl border border-white/10 bg-[#141416]/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div key={step} className="onboarding-enter flex-1 px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              Passo {step + 1} de {steps.length}
            </p>

            {step === 0 ? (
              <div className="mt-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white">Como a empresa se chama?</h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#C8C8D0]">
                  Esse nome aparece na agenda e no link de agendamento.
                </p>
                <label className="mt-8 block text-sm text-[#C8C8D0]">
                  Nome
                  <input
                    value={companyName}
                    onChange={(event) => {
                      setCompanyName(event.target.value);
                      setNameError(null);
                    }}
                    className={`mt-2 h-14 w-full rounded-2xl border bg-[#101014] px-4 text-lg text-white outline-none focus:border-accent ${
                      nameError ? "border-[#E5484D]" : "border-white/10"
                    }`}
                    placeholder="Studio Lumière"
                  />
                </label>
                {nameError ? <p className="mt-2 text-sm text-[#ff8d90]">{nameError}</p> : null}
                <div className="mt-6 rounded-2xl border border-white/10 bg-[#0e0e12] p-4">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8E8E99] uppercase">Prévia</p>
                  <p className="mt-3 text-xl font-semibold text-white">{companyName.trim() || "Sua empresa"}</p>
                  <p className="mt-1 text-sm text-accent">Agenda aberta para horários</p>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white">Qual é a categoria do negócio?</h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#C8C8D0]">
                  Pet, barbearia, estética e os outros ramos do sistema. As categorias de serviço entram depois.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {businessSegments.map((item) => {
                    const selected = segment === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        className={`cursor-pointer rounded-2xl border px-4 py-4 text-left ${
                          selected ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/20"
                        }`}
                        onClick={() => {
                          setSegment(item.id);
                          setSegmentError(null);
                        }}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-white">{item.label}</span>
                          <span
                            className={`grid size-6 place-items-center rounded-full border text-xs ${
                              selected
                                ? "border-transparent bg-accent text-[#062626]"
                                : "border-white/15 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-[#C8C8D0]">{item.detail}</span>
                      </button>
                    );
                  })}
                </div>
                {segmentError ? <p className="mt-3 text-sm text-[#ff8d90]">{segmentError}</p> : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white">Quantas pessoas atendem?</h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#C8C8D0]">
                  Isso organiza a equipe. Os nomes de cada profissional entram depois.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {teamSizes.map((size) => {
                    const selected = teamSize === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        aria-pressed={selected}
                        className={`cursor-pointer rounded-2xl border px-4 py-4 text-left ${
                          selected ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/25"
                        }`}
                        onClick={() => setTeamSize(size.id)}
                      >
                        <span className={`flex flex-wrap gap-1.5 ${selected ? "text-accent" : "text-[#8E8E99]"}`}>
                          {Array.from({ length: size.marks }, (_, mark) => (
                            <ChairIcon key={mark} className="size-5" />
                          ))}
                        </span>
                        <span className="mt-4 block text-base font-semibold text-white">{size.label}</span>
                        <span className="mt-1 block text-sm text-[#C8C8D0]">{size.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mt-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white">Quando a casa abre?</h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#C8C8D0]">
                  Ligue o interruptor nos dias em que a casa abre e escolha o horário.
                </p>
                <ul className="mt-8 space-y-2">
                  {hours.map((day) => {
                    const span = daySpan(day.openTime, day.closeTime);
                    return (
                      <li
                        key={day.dayOfWeek}
                        className={`rounded-2xl border px-3 py-3 ${
                          day.open ? "border-white/10 bg-[#101014]" : "border-white/6 bg-[#101014]/70"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`grid size-11 place-items-center rounded-full text-xs font-semibold ${
                              day.open ? "bg-accent text-[#062626]" : "bg-white/8 text-[#8E8E99]"
                            }`}
                          >
                            {day.short}
                          </span>
                          <span className="flex-1" />
                          <button
                            type="button"
                            role="switch"
                            aria-checked={day.open}
                            aria-label={`${day.label} ${day.open ? "aberto" : "fechado"}`}
                            className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-1 pl-1"
                            onClick={() => updateDay(day.dayOfWeek, { open: !day.open })}
                          >
                            <span className="w-16 text-right text-sm font-semibold text-white">
                              {day.open ? "Aberto" : "Fechado"}
                            </span>
                            <span
                              className={`relative h-7 w-12 rounded-full ${day.open ? "bg-accent" : "bg-white/15"}`}
                            >
                              <span
                                className={`absolute top-1 size-5 rounded-full bg-white shadow ${
                                  day.open ? "left-6" : "left-1"
                                }`}
                              />
                            </span>
                          </button>
                          {day.open ? (
                            <div className="flex w-full items-center gap-2 sm:w-auto">
                              <input
                                type="time"
                                value={day.openTime}
                                aria-label={`Abertura de ${day.label}`}
                                className="h-10 rounded-xl border border-white/10 bg-[#0e0e12] px-2 text-sm text-white"
                                onChange={(event) => updateDay(day.dayOfWeek, { openTime: event.target.value })}
                              />
                              <span className="text-sm text-[#8E8E99]">às</span>
                              <input
                                type="time"
                                value={day.closeTime}
                                aria-label={`Fechamento de ${day.label}`}
                                className="h-10 rounded-xl border border-white/10 bg-[#0e0e12] px-2 text-sm text-white"
                                onChange={(event) => updateDay(day.dayOfWeek, { closeTime: event.target.value })}
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                          {day.open ? (
                            <span className="absolute inset-y-0 rounded-full bg-accent" style={span} />
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {hoursError ? <p className="mt-3 text-sm text-[#ff8d90]">{hoursError}</p> : null}
              </div>
            ) : null}

            {error ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}
          </div>

          <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4 sm:px-8">
            <p className="hidden text-sm text-[#8E8E99] sm:block">
              {step + 1} / {steps.length}
            </p>
            <div className="ml-auto flex gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  className="h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#C8C8D0] hover:bg-white/6"
                  onClick={() => setStep((current) => current - 1)}
                >
                  Voltar
                </button>
              ) : null}
              {nextLabel ? (
                <button
                  type="button"
                  className="h-11 cursor-pointer rounded-xl bg-accent px-5 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0]"
                  onClick={nextStep}
                >
                  Continuar para {nextLabel.toLowerCase()}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  className="h-11 cursor-pointer rounded-xl bg-accent px-5 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={finish}
                >
                  {pending ? "Salvando..." : "Abrir a agenda"}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
