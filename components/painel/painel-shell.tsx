"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import { MarcaiLogo } from "@/components/brand/marcai-logo";
import { clearSession, getSessionSnapshot, subscribeSession } from "@/lib/session";

const nav = [
  { label: "Painel", icon: "grid", href: "/painel" },
  { label: "Agenda", icon: "calendar", href: "/painel/agenda" },
  { label: "Clientes", icon: "users", href: "/painel/clientes" },
  { label: "Subcategorias", icon: "tag", href: "/painel/categorias" },
  { label: "Serviços", icon: "scissors", href: "/painel/servicos" },
  { label: "Profissionais", icon: "user", href: "/painel/profissionais" },
  { label: "Horários", icon: "clock", href: "/painel/horarios" },
  { label: "Equipe", icon: "team", href: "/painel/equipe" },
  { label: "Empresa", icon: "store", href: "/painel/empresa" },
] as const;

function subscribeReady() {
  return () => {};
}

export function PainelShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!session.companyId) {
      router.replace("/onboarding");
    }
  }, [ready, router, session]);

  if (!ready || !session || !session.companyId) {
    return <main className="flex flex-1 items-center justify-center bg-[#070708] text-[#A7A7B2]">Carregando...</main>;
  }

  const initials = session.user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-full flex-1 bg-[#070708] p-3 text-white sm:p-4">
      <div className="flex min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0e0e12]">
        <aside className="hidden w-[232px] shrink-0 flex-col border-r border-white/8 bg-[#101014] p-4 md:flex">
          <Link href="/" className="px-2 py-1">
            <MarcaiLogo variant="light" className="h-8 w-auto" />
          </Link>
          <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Painel">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  isCurrent(pathname, item.href) ? "bg-white/8 text-white" : "text-[#A7A7B2] hover:bg-white/6 hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="rounded-2xl border border-white/8 bg-[#141418] p-4">
            <p className="text-sm font-semibold text-white">Agenda do salão</p>
            <p className="mt-1 text-xs leading-5 text-[#A7A7B2]">
              Equipe, horários e clientes no mesmo lugar.
            </p>
          </div>
          <button
            type="button"
            className="mt-3 cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#C8C8D0] hover:bg-white/6 hover:text-white"
            onClick={() => {
              clearSession();
              router.replace("/login");
            }}
          >
            Sair
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="md:hidden">
                <MarcaiLogo variant="light" className="h-7 w-auto" />
              </Link>
              <nav className="flex gap-2 overflow-auto md:hidden" aria-label="Painel">
                {nav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${
                      isCurrent(pathname, item.href) ? "bg-white/8 text-white" : "text-[#A7A7B2]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-[#C8C8D0] hover:bg-white/6 hover:text-white md:hidden"
                onClick={() => {
                  clearSession();
                  router.replace("/login");
                }}
              >
                Sair
              </button>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {initials}
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold text-white">{session.user.name}</span>
                  <span className="block text-xs text-[#8E8E99]">{session.user.email}</span>
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto px-4 py-5 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function isCurrent(pathname: string, href: string) {
  if (href === "/painel") {
    return pathname === "/painel";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }: { name: (typeof nav)[number]["icon"] }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;

  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 3.5V7M16 3.5V7M4 10h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "users" || name === "team") {
    return (
      <svg {...common}>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.75" />
        <path d="M4.5 18.5c.8-2.4 2.5-3.5 4.5-3.5s3.7 1.1 4.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="16.5" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M16 15c1.6.2 2.8 1 3.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "scissors") {
    return (
      <svg {...common}>
        <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="7" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8.8 8.6 19 17M8.8 15.4 19 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "tag") {
    return (
      <svg {...common}>
        <path d="M4 12.5 12.2 4.3A2 2 0 0 1 13.6 3.7H19a1.5 1.5 0 0 1 1.5 1.5v5.4a2 2 0 0 1-.6 1.4L11.7 20.2a1.8 1.8 0 0 1-2.5 0L4 15a1.8 1.8 0 0 1 0-2.5Z" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="16.2" cy="7.8" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 8.5V12l2.5 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "store") {
    return (
      <svg {...common}>
        <path d="M4 10.5 6 4.5h12L20 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M5 10.5h14V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.75" />
        <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M6 19c1-2.6 2.8-4 6-4s5 1.4 6 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
