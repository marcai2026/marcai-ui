const TOKEN_KEY = "marcai.accessToken";
const USER_KEY = "marcai.user";
const COMPANY_KEY = "marcai.companyId";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type Session = {
  accessToken: string;
  user: SessionUser;
  companyId: string | null;
};

function readStorage(storage: Storage): Session | null {
  const accessToken = storage.getItem(TOKEN_KEY);
  const rawUser = storage.getItem(USER_KEY);

  if (!accessToken || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as SessionUser;
    return {
      accessToken,
      user,
      companyId: storage.getItem(COMPANY_KEY),
    };
  } catch {
    return null;
  }
}

export function readCompanyId(token: string) {
  try {
    const part = token.split(".")[1];
    if (!part) {
      return null;
    }

    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { companyId?: string };
    return payload.companyId ?? null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session, persist: boolean) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(COMPANY_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(COMPANY_KEY);

  const storage = persist ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, session.accessToken);
  storage.setItem(USER_KEY, JSON.stringify(session.user));

  if (session.companyId) {
    storage.setItem(COMPANY_KEY, session.companyId);
  }
}

export function getSession() {
  return readStorage(localStorage) ?? readStorage(sessionStorage);
}

let snapshotKey = "";
let snapshot: Session | null = null;

export function getSessionSnapshot() {
  const key = [
    localStorage.getItem(TOKEN_KEY),
    localStorage.getItem(USER_KEY),
    localStorage.getItem(COMPANY_KEY),
    sessionStorage.getItem(TOKEN_KEY),
    sessionStorage.getItem(USER_KEY),
    sessionStorage.getItem(COMPANY_KEY),
  ].join("\0");

  if (key === snapshotKey) {
    return snapshot;
  }

  snapshotKey = key;
  snapshot = getSession();
  return snapshot;
}

export function subscribeSession() {
  return () => {};
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(COMPANY_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(COMPANY_KEY);
}
