"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Member = {
  id: string;
  role: "OWNER" | "PROFESSIONAL" | "RECEPTIONIST";
  status: "ACTIVE" | "INACTIVE";
  user: {
    name: string;
    email: string;
  };
};

const roleLabel = {
  OWNER: "Dono",
  PROFESSIONAL: "Profissional",
  RECEPTIONIST: "Recepção",
} as const;

export function TeamBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("RECEPTIONIST");
  const [loading, setLoading] = useState(Boolean(companyId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    api<Member[]>(`/api/companies/${companyId}/members`)
      .then((rows) => {
        if (active) {
          setMembers(rows.filter((member) => member.status === "ACTIVE"));
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar a equipe.");
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
  }, [companyId]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      const created = await api<Member>(`/api/companies/${companyId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), role }),
      });
      setMembers((current) => [...current.filter((item) => item.id !== created.id), created]);
      setEmail("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível adicionar o membro.");
    } finally {
      setPending(false);
    }
  }

  async function changeRole(member: Member, nextRole: Member["role"]) {
    if (!companyId) {
      return;
    }

    setError(null);
    try {
      const updated = await api<Member>(`/api/companies/${companyId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      setMembers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível alterar o papel.");
    }
  }

  async function removeMember(memberId: string) {
    if (!companyId) {
      return;
    }

    setError(null);
    try {
      await api(`/api/companies/${companyId}/members/${memberId}`, { method: "DELETE" });
      setMembers((current) => current.filter((item) => item.id !== memberId));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível remover o membro.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Equipe</h1>
        <p className="mt-1 text-sm text-[#B7B7C2]">Quem acessa o painel. A pessoa precisa já ter uma conta com esse e-mail.</p>
      </div>
      {loading ? <p className="text-sm text-[#A7A7B2]">Carregando...</p> : null}
      {error ? <p className="text-sm text-[#ff8d90]">{error}</p> : null}

      <form className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-[#141418] p-5" onSubmit={addMember}>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@empresa.com"
          className="h-11 min-w-56 flex-1 rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as Member["role"])}
          className="h-11 rounded-xl border border-white/10 bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent"
        >
          <option value="RECEPTIONIST">Recepção</option>
          <option value="PROFESSIONAL">Profissional</option>
          <option value="OWNER">Dono</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      <ul className="divide-y divide-white/8 rounded-2xl border border-white/8 bg-[#141418] px-5">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-40 flex-1">
              <p className="text-sm font-semibold text-white">{member.user.name}</p>
              <p className="text-xs text-[#A7A7B2]">{member.user.email}</p>
            </div>
            <select
              value={member.role}
              onChange={(event) => changeRole(member, event.target.value as Member["role"])}
              className="h-10 rounded-lg border border-white/10 bg-[#101014] px-2 text-sm text-white"
            >
              {Object.entries(roleLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="cursor-pointer text-sm font-semibold text-[#C8C8D0] hover:text-white"
              onClick={() => removeMember(member.id)}
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
