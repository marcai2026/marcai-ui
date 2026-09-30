import { getSession } from "@/lib/session";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique se o servidor está no ar.");
  }

  const data = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    const fallback =
      response.status >= 500
        ? "Não foi possível conectar à API. Verifique se o servidor está no ar."
        : "Não foi possível concluir a solicitação.";

    throw new ApiError(response.status, data?.message ?? fallback);
  }

  return data as T;
}

function authHeader() {
  if (typeof window === "undefined") {
    return {};
  }

  const session = getSession();
  if (!session) {
    return {};
  }

  return { Authorization: `Bearer ${session.accessToken}` };
}
