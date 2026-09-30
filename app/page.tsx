import Link from "next/link";

import { MarcaiLogo } from "@/components/brand/marcai-logo";

const features = [
  {
    title: "Organize seu tempo sem complicação",
    description:
      "Defina seus horários de trabalho, cadastre profissionais e mantenha a agenda do negócio em um só lugar.",
  },
  {
    title: "Acompanhe seus agendamentos",
    description:
      "Veja os horários do dia, confirme atendimentos e não deixe um cliente passar despercebido.",
  },
  {
    title: "Deixe tudo com o seu estilo próprio",
    description:
      "Atualize serviços, valores e a apresentação do negócio de forma rápida e simples.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Entre com e-mail e senha. A empresa é o passo seguinte.",
  },
  {
    number: "02",
    title: "Monte a agenda",
    description: "Cadastre serviços, profissionais e o expediente de cada um.",
  },
  {
    number: "03",
    title: "Receba horários",
    description: "A equipe acompanha o dia e o cliente marca no link do negócio.",
  },
];

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
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,420px)] lg:py-24">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-accent">
                Para salões, clínicas e estúdios
              </p>
              <h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight sm:text-5xl">
                Organize seu tempo sem complicação
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/75">
                A Marcai cuida da agenda de quem atende hora marcada: horários, profissionais e
                agendamentos no mesmo lugar.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?modo=cadastrar"
                  className="inline-flex h-14 items-center justify-center rounded-lg bg-accent px-6 font-display text-base font-bold text-ink"
                >
                  Começar agora
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center rounded-lg border border-white/15 px-6 font-display text-base font-bold text-white"
                >
                  Entrar
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold">Hoje</p>
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  4 horários
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  ["09:00", "Corte", "Ana"],
                  ["10:30", "Coloração", "Marina"],
                  ["14:00", "Consulta", "Paulo"],
                  ["16:30", "Barba", "Ana"],
                ].map(([time, service, professional]) => (
                  <li
                    key={time}
                    className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3 text-ink"
                  >
                    <span className="font-display text-sm font-bold text-accent">{time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{service}</span>
                      <span className="block text-xs text-body">{professional}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="produto" className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="max-w-lg font-display text-3xl font-bold">
            Feita para quem vive de horário marcado
          </h2>
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

        <section className="bg-ink text-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="max-w-xl font-display text-3xl font-bold">
                Sua agenda pronta para o próximo cliente
              </h2>
              <p className="mt-3 max-w-lg text-base leading-7 text-white/70">
                Crie a conta em poucos minutos e comece a organizar os atendimentos do dia.
              </p>
            </div>
            <Link
              href="/login?modo=cadastrar"
              className="inline-flex h-14 shrink-0 items-center justify-center rounded-lg bg-accent px-6 font-display text-base font-bold text-ink"
            >
              Criar conta
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <MarcaiLogo className="h-7 w-auto" />
          <p className="text-sm text-body">Agenda para quem atende hora marcada.</p>
        </div>
      </footer>
    </div>
  );
}
