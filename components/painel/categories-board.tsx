"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import { categoryColors, type CategoryColor } from "@/lib/category-colors";
import { getSessionSnapshot, subscribeSession } from "@/lib/session";

type Category = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  color: categoryColors[0].value as CategoryColor,
};

export function CategoriesBoard() {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => null);
  const companyId = session?.companyId ?? null;
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId) {
      return;
    }

    let active = true;
    setLoading(true);

    api<Category[]>("/api/categories")
      .then((result) => {
        if (active) {
          setCategories(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof ApiError ? caught.message : "Não foi possível carregar as categorias.");
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

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setNameError(null);
    setError(null);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
      color: (categoryColors.find((color) => color.value === category.color)?.value ??
        categoryColors[0].value) as CategoryColor,
    });
    setNameError(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();

    if (name.length < 2) {
      setNameError("O nome precisa ter pelo menos 2 caracteres.");
      return;
    }

    setNameError(null);
    setError(null);
    setPending(true);

    const body = {
      name,
      description: form.description.trim(),
      color: form.color,
    };

    try {
      if (editingId) {
        const updated = await api<Category>(`/api/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api<Category>("/api/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      }

      startCreate();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível salvar a categoria.");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(category: Category) {
    setError(null);

    try {
      const updated = await api<Category>(`/api/categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível atualizar a categoria.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Categorias</h1>
        <p className="mt-1 text-sm text-[#B7B7C2]">Agrupe os serviços do salão, como Cabelo, Unhas e Barba.</p>
      </div>

      {companyId ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <form
            className="rounded-2xl border border-white/8 bg-[#141418] p-5"
            noValidate
            onSubmit={handleSubmit}
          >
            <h2 className="text-base font-semibold text-white">
              {editingId ? "Editar categoria" : "Nova categoria"}
            </h2>
            <label className="mt-4 block text-sm text-[#C8C8D0]">
              Nome
              <input
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setNameError(null);
                }}
                className={`mt-1.5 h-11 w-full rounded-xl border bg-[#101014] px-3 text-sm text-white outline-none focus:border-accent ${
                  nameError ? "border-[#E5484D]" : "border-white/10"
                }`}
                placeholder="Cabelo"
              />
            </label>
            {nameError ? <p className="mt-1.5 text-sm text-[#ff8d90]">{nameError}</p> : null}

            <label className="mt-4 block text-sm text-[#C8C8D0]">
              Descrição
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="mt-1.5 min-h-20 w-full rounded-xl border border-white/10 bg-[#101014] px-3 py-2 text-sm text-white outline-none focus:border-accent"
                placeholder="Cortes, escova e tratamentos"
              />
            </label>

            <fieldset className="mt-4">
              <legend className="text-sm text-[#C8C8D0]">Cor</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryColors.map((color) => {
                  const selected = form.color === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      aria-label={color.name}
                      aria-pressed={selected}
                      title={color.name}
                      className={`h-9 w-9 cursor-pointer rounded-full border-2 ${
                        selected ? "border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setForm((current) => ({ ...current, color: color.value }))}
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[#8E8E99]">
                {categoryColors.find((color) => color.value === form.color)?.name}
              </p>
            </fieldset>

            {error ? <p className="mt-4 text-sm text-[#ff8d90]">{error}</p> : null}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="h-11 cursor-pointer rounded-xl bg-accent px-4 text-sm font-semibold text-[#062626] hover:bg-[#5ef0f0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Salvando..." : editingId ? "Salvar" : "Criar categoria"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-[#C8C8D0] hover:bg-white/6"
                  onClick={startCreate}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <section className="rounded-2xl border border-white/8 bg-[#141418] p-5">
            <h2 className="text-base font-semibold text-white">Lista</h2>
            {loading ? <p className="mt-4 text-sm text-[#A7A7B2]">Carregando...</p> : null}
            {!loading && categories.length === 0 ? (
              <p className="mt-4 text-sm text-[#A7A7B2]">Nenhuma categoria ainda. A primeira pode ser Cabelo.</p>
            ) : null}
            <ul className="mt-4 space-y-2">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-[#101014] px-3.5 py-3"
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-semibold text-white">{category.name}</p>
                    <p className="text-xs text-[#A7A7B2]">
                      {category.description || "Sem descrição"} · {category.isActive ? "Ativa" : "Inativa"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-sm font-semibold text-accent hover:underline"
                    onClick={() => startEdit(category)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer text-sm font-semibold text-[#C8C8D0] hover:text-white"
                    onClick={() => toggleActive(category)}
                  >
                    {category.isActive ? "Desativar" : "Ativar"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <p className="rounded-2xl border border-white/8 bg-[#141418] px-5 py-4 text-sm leading-6 text-[#C8C8D0]">
          As categorias pertencem à empresa. Esta conta ainda não tem uma empresa cadastrada, então a lista não pode ser gravada.
        </p>
      )}
    </div>
  );
}
