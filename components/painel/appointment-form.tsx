"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Named = { id: string; name: string };
type CustomerList = { data: Named[] };
type Slot = { startsAt: string; endsAt: string; formattedTime: string };
type ProfessionalService = { serviceId: string };

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function AppointmentForm() {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [clients, setClients] = useState<Named[]>([]);
  const [services, setServices] = useState<Named[]>([]);
  const [professionals, setProfessionals] = useState<Named[]>([]);
  const [offeredBy, setOfferedBy] = useState<Record<string, string[]>>({});
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(todayKey);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loadedSlotKey, setLoadedSlotKey] = useState<string | null>(null);
  const slotKey = `${companyId ?? ""}:${serviceId}:${professionalId}:${date}`;
  const slotsLoading = Boolean(companyId && serviceId && professionalId && date) && loadedSlotKey !== slotKey;

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
      .then(async ([customerPage, serviceRows, professionalRows]) => {
        if (!active) {
          return;
        }
        setClients(customerPage.data);
        setServices(serviceRows);
        setProfessionals(professionalRows);
        const links = await Promise.all(
          professionalRows.map(async (professional) => {
            const rows = await api<ProfessionalService[]>(
              `/api/companies/${companyId}/professionals/${professional.id}/services`,
            );
            return [professional.id, rows.map((row) => row.serviceId)] as const;
          }),
        );
        if (active) {
          setOfferedBy(Object.fromEntries(links));
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar os dados do agendamento.");
        }
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  const availableProfessionals = professionals.filter((professional) =>
    serviceId ? (offeredBy[professional.id] ?? []).includes(serviceId) : true,
  );

  useEffect(() => {
    if (!companyId || !serviceId || !professionalId || !date) {
      return;
    }

    let active = true;
    const params = new URLSearchParams({ serviceId, professionalId, date });
    api<Slot[]>(`/api/companies/${companyId}/availability?${params.toString()}`)
      .then((rows) => {
        if (active) {
          setSlots(rows);
          setStartsAt("");
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
  }, [companyId, date, professionalId, serviceId, slotKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      return;
    }
    if (!clientId || !serviceId || !professionalId || !startsAt) {
      setError("Escolha cliente, serviço, profissional e um horário livre.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const created = await api<{ id: string }>(`/api/companies/${companyId}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          clientId,
          serviceId,
          professionalId,
          startsAt,
          notes: notes.trim() || null,
        }),
      });
      router.push(`/painel/agenda/${created.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível criar o agendamento.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Link href="/painel/agenda" className="text-sm font-semibold text-[#C8C8D0] hover:text-white">
        Voltar para a agenda
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Novo agendamento</h1>
      <p className="mt-1 text-sm text-[#B7B7C2]">O horário livre, o preço e o fim do atendimento são calculados pela API.</p>

      <form className="scheme-dark mt-6 rounded-2xl border border-white/8 bg-[#141418] p-5" onSubmit={handleSubmit}>
        <Select label="Cliente" value={clientId} onChange={setClientId} placeholder="Escolha o cliente" options={clients} />
        <Select label="Serviço" value={serviceId} onChange={setServiceId} placeholder="Escolha o serviço" options={services} />
        <Select
          label="Profissional"
          value={professionalId}
          onChange={setProfessionalId}
          placeholder={availableProfessionals.length === 0 ? "Ninguém executa esse serviço" : "Escolha o profissional"}
          options={availableProfessionals}
        />
        <label className="mt-4 block text-sm text-[#C8C8D0]">
          Data
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
          />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm text-[#C8C8D0]">Horário livre</legend>
          {slotsLoading ? <p className="mt-2 text-sm text-[#A7A7B2]">Consultando a disponibilidade...</p> : null}
          {!slotsLoading && serviceId && professionalId && slots.length === 0 ? (
            <p className="mt-2 text-sm text-[#A7A7B2]">Nenhum horário livre nessa data.</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.startsAt}
                type="button"
                aria-pressed={startsAt === slot.startsAt}
                className={`h-10 cursor-pointer rounded-lg px-3 text-sm font-semibold ${
                  startsAt === slot.startsAt ? "bg-accent text-[#062626]" : "border border-white/10 text-white"
                }`}
                onClick={() => setStartsAt(slot.startsAt)}
              >
                {slot.formattedTime}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block text-sm text-[#C8C8D0]">
          Observações
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1.5 min-h-20 w-full rounded-xl border border-white/10 bg-[#101014] px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </label>

        {error ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Agendar"}
        </button>
      </form>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Named[];
}) {
  return (
    <label className="mt-4 block text-sm text-[#C8C8D0] first:mt-0">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
