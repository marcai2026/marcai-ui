import Link from "next/link";

const stats = [
  { label: "Agendamentos hoje", value: "18", hint: "+3 em relação a ontem", detail: "Corte, cor e barba" },
  { label: "Confirmados", value: "14", hint: "4 ainda aguardam", detail: "Clientes com horário marcado" },
  { label: "Ocupação", value: "76%", hint: "+8% na semana", detail: "Cadeiras preenchidas hoje" },
  { label: "Horários livres", value: "6", hint: "2 no fim da tarde", detail: "Ainda dá para encaixar" },
];

const thisWeek = [12, 15, 11, 18, 16, 9];
const lastWeek = [10, 9, 14, 12, 13, 8];
const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const upcoming = [
  { time: "09:00", service: "Corte e escova", client: "Marina Costa", professional: "Camila", status: "Confirmado" },
  { time: "09:40", service: "Coloração", client: "Juliana Alves", professional: "Renata", status: "Em atendimento" },
  { time: "10:30", service: "Barba", client: "Pedro Lima", professional: "Diego", status: "Aguardando" },
  { time: "11:15", service: "Hidratação", client: "Ana Souza", professional: "Camila", status: "Confirmado" },
];

const team = [
  { name: "Camila", role: "Cabelo", next: "09:00 · Marina" },
  { name: "Renata", role: "Coloração", next: "09:40 · Juliana" },
  { name: "Diego", role: "Barba", next: "10:30 · Pedro" },
];

const actions = [
  { title: "Novo horário", detail: "Encaixar um cliente na agenda de hoje", href: "/painel/agenda/novo" },
  { title: "Novo cliente", detail: "Guardar o contato para o próximo retorno", href: "/painel/clientes/novo" },
  { title: "Bloquear horário", detail: "Almoço, folga ou cadeira em manutenção", href: "/painel/horarios" },
];

function points(values: number[]) {
  const width = 320;
  const height = 120;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / 20) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export function SalonBoard({ firstName }: { firstName: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Olá, {firstName}</h1>
          <p className="mt-1 text-sm text-[#B7B7C2]">O movimento de hoje no salão.</p>
        </div>
        <div className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[#062626]">
          Novo horário
        </div>
      </div>

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
            <polyline points={points(lastWeek)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
            <polyline points={points(thisWeek)} fill="none" stroke="#00CACA" strokeWidth="2.5" />
            {days.map((day, index) => (
              <text
                key={day}
                x={(index / (days.length - 1)) * 320}
                y="144"
                textAnchor={index === 0 ? "start" : index === days.length - 1 ? "end" : "middle"}
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
            {actions.map((action) => {
              const body = (
                <>
                  <p className="text-sm font-semibold text-white">{action.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#A7A7B2]">{action.detail}</p>
                </>
              );

              return (
                <li key={action.title}>
                  <Link href={action.href} className="block rounded-xl border border-white/8 bg-[#101014] px-3.5 py-3 hover:border-accent/40">
                    {body}
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <article className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <h2 className="text-base font-semibold text-white">Próximos horários</h2>
          <p className="mt-1 text-sm text-[#A7A7B2]">A fila da manhã, na ordem da agenda.</p>
          <ul className="mt-4 divide-y divide-white/8">
            {upcoming.map((item) => (
              <li key={`${item.time}-${item.client}`} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-14 text-sm font-semibold text-accent">{item.time}</span>
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-semibold text-white">{item.service}</p>
                  <p className="text-xs text-[#A7A7B2]">
                    {item.client} · {item.professional}
                  </p>
                </div>
                <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs font-semibold text-[#D4D4DC]">
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-white/8 bg-[#141418] p-5">
          <h2 className="text-base font-semibold text-white">Equipe de hoje</h2>
          <p className="mt-1 text-sm text-[#A7A7B2]">Quem está na cadeira e o próximo cliente.</p>
          <ul className="mt-4 space-y-2">
            {team.map((person) => (
              <li key={person.name} className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#101014] px-3.5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {person.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{person.name}</p>
                  <p className="text-xs text-[#A7A7B2]">
                    {person.role} · {person.next}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
