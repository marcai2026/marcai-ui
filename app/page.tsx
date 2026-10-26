import Link from "next/link";

import { MarcaiLogo } from "@/components/brand/marcai-logo";

const signupHref = "/login?modo=cadastrar";

const features = [
  {
    title: "Agenda do dia",
    description: "Veja quem chega, confirme, conclua ou registre quando a pessoa não vem.",
  },
  {
    title: "Expediente com intervalo",
    description: "Cada profissional tem o próprio horário. Dois turnos no mesmo dia deixam o almoço no meio.",
  },
  {
    title: "Clientes e serviços",
    description: "Guarde nome e telefone, cadastre o que a empresa atende e defina preço e duração de quem executa.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie a empresa",
    description: "Informe o nome e o contato. Em seguida, marque o que o negócio atende.",
  },
  {
    number: "02",
    title: "Monte a agenda",
    description: "Cadastre serviços, profissionais, o expediente de cada um e os bloqueios do dia.",
  },
  {
    number: "03",
    title: "Marque o dia",
    description: "A equipe encaixa o cliente num horário livre e acompanha o atendimento até o fim.",
  },
];

const audiences = ["Salão", "Barbearia", "Clínica", "Estúdio"];

const plans = [
  {
    name: "15 dias grátis",
    price: "R$ 0",
    period: "por 15 dias",
    detail: "O painel inteiro para a equipe experimentar a agenda.",
    items: ["Agenda do dia", "Clientes, serviços e profissionais", "Expediente e bloqueios", "Equipe no mesmo painel"],
    href: signupHref,
    cta: "Começar teste",
    featured: false,
  },
  {
    name: "Salão",
    price: "R$ 89",
    period: "por mês, depois do teste",
    detail: "Para quem atende com uma equipe de até 5 profissionais.",
    items: ["Tudo do teste", "Até 5 profissionais", "Preço e duração por profissional", "Almoço, folga e manutenção"],
    href: signupHref,
    cta: "Escolher Salão",
    featured: true,
  },
  {
    name: "Estúdio",
    price: "R$ 149",
    period: "por mês, depois do teste",
    detail: "Para clínica ou casa com a equipe toda na mesma agenda.",
    items: ["Tudo do Salão", "Profissionais sem limite", "Dono, recepção e profissional", "Vários turnos no mesmo dia"],
    href: signupHref,
    cta: "Escolher Estúdio",
    featured: false,
  },
];

const hours = ["09", "10", "11", "12", "13"];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-white text-ink">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="shrink-0">
            <MarcaiLogo variant="light" className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            <a href="#produto" className="hidden text-sm text-white/75 sm:inline">
              Produto
            </a>
            <a href="#como-funciona" className="hidden text-sm text-white/75 sm:inline">
              Como funciona
            </a>
            <a href="#planos" className="hidden text-sm text-white/75 sm:inline">
              Planos
            </a>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg bg-white px-4 font-display text-sm font-bold text-ink"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-ink text-white">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] lg:py-24">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-accent">
                Para salões, barbearias, clínicas e estúdios
              </p>
              <h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight sm:text-5xl">
                O dia de quem atende, num lugar só
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/75">
                A Marcai reúne a agenda, os profissionais e os horários do negócio. A equipe confirma o
                atendimento e deixa o almoço fora da marcação.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={signupHref}
                  className="inline-flex h-14 items-center justify-center rounded-lg bg-accent px-6 font-display text-base font-bold text-ink"
                >
                  Começar 15 dias grátis
                </Link>
                <a href="#como-funciona" className="inline-flex h-14 items-center justify-center px-2 text-sm font-semibold text-white/80">
                  Ver como funciona
                </a>
              </div>
            </div>

            <DayBoard />
          </div>
        </section>

        <section id="produto" className="mx-auto w-full max-w-6xl px-6 py-20">
          <p className="font-display text-sm font-bold text-accent">Produto</p>
          <h2 className="mt-3 max-w-lg font-display text-3xl font-bold">Feita para a rotina de hora marcada</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {audiences.map((audience) => (
              <li key={audience} className="rounded-full border border-line px-3 py-1 text-sm text-body">
                {audience}
              </li>
            ))}
          </ul>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl bg-canvas p-6">
                <div className="mb-5 h-1.5 w-10 rounded-full bg-accent" />
                <h3 className="font-display text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-base leading-7 text-body">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="bg-canvas">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <h2 className="font-display text-3xl font-bold">Como funciona</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <li key={step.number} className="rounded-2xl bg-white p-6">
                  <p className="font-display text-sm font-bold text-accent">{step.number}</p>
                  <h3 className="mt-3 font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-base leading-7 text-body">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="planos" className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-bold">Planos</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-body">
            Os 15 dias começam quando a empresa é criada. Salão e Estúdio são as opções para continuar.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-6 ${
                  plan.featured ? "border-accent bg-ink text-white" : "border-line bg-white"
                }`}
              >
                <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                <p className={`mt-4 font-display text-4xl font-bold ${plan.featured ? "text-accent" : "text-ink"}`}>
                  {plan.price}
                </p>
                <p className={`mt-1 text-sm ${plan.featured ? "text-white/70" : "text-body"}`}>{plan.period}</p>
                <p className={`mt-4 text-base leading-7 ${plan.featured ? "text-white/80" : "text-body"}`}>{plan.detail}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 inline-flex h-12 items-center justify-center rounded-lg px-4 font-display text-sm font-bold ${
                    plan.featured ? "bg-accent text-ink" : "bg-ink text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-ink text-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="max-w-xl font-display text-3xl font-bold">Quinze dias para organizar o próximo dia</h2>
              <p className="mt-3 max-w-lg text-base leading-7 text-white/70">
                Crie a conta, monte a agenda da equipe e veja os horários no painel.
              </p>
            </div>
            <Link
              href={signupHref}
              className="inline-flex h-14 shrink-0 items-center justify-center rounded-lg bg-accent px-6 font-display text-base font-bold text-ink"
            >
              Começar 15 dias grátis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <MarcaiLogo className="h-7 w-auto" />
          <nav className="flex flex-wrap gap-4 text-sm text-body">
            <a href="#produto">Produto</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#planos">Planos</a>
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function DayBoard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#141418] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs text-white/50">Segunda</p>
          <p className="font-display text-sm font-bold">Agenda do dia</p>
        </div>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">2 profissionais</span>
      </div>

      <div className="mt-4 grid grid-cols-[44px_1fr_1fr] gap-x-2">
        <div />
        <p className="pb-2 text-center text-xs font-semibold text-white/70">Ana</p>
        <p className="pb-2 text-center text-xs font-semibold text-white/70">Marina</p>
      </div>

      <div className="relative">
        <div>
          {hours.map((hour) => (
            <div key={hour} className="grid h-11 grid-cols-[44px_1fr_1fr] gap-x-2">
              <p className="pt-1 text-[11px] text-white/35">{hour}:00</p>
              <div className="border-t border-white/8" />
              <div className="border-t border-white/8" />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 grid grid-cols-[44px_1fr_1fr] gap-x-2"
          style={{ gridTemplateRows: `repeat(${hours.length}, 2.75rem)` }}
        >
          <Appointment column="ana" row={1} title="Corte" detail="Marina Costa" status="Confirmado" />
          <Appointment column="ana" row={3} title="Barba" detail="Pedro Lima" status="Concluído" />
          <Appointment column="marina" row={1} span={2} title="Coloração" detail="Juliana Alves" status="Confirmado" />
          <Appointment column="ana" row={5} title="Corte" detail="Ana Souza" status="Aguardando" />
          <div className="col-span-2 col-start-2 row-start-4 p-1">
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/15 text-xs text-white/55">
              Almoço
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Appointment({
  column,
  row,
  span = 1,
  title,
  detail,
  status,
}: {
  column: "ana" | "marina";
  row: number;
  span?: number;
  title: string;
  detail: string;
  status: string;
}) {
  return (
    <div
      className={`p-1 ${column === "ana" ? "col-start-2" : "col-start-3"}`}
      style={{ gridRow: `${row} / span ${span}` }}
    >
      <div className="flex h-full flex-col justify-center rounded-lg bg-white px-2.5 text-ink">
        <span className="truncate text-xs font-semibold">
          {title}
          <span className="ml-1.5 font-sans text-[10px] font-semibold text-accent">{status}</span>
        </span>
        <span className="truncate text-[11px] text-body">{detail}</span>
      </div>
    </div>
  );
}
