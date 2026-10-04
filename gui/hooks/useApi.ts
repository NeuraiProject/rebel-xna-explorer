import * as React from "react";

export interface ApiError {
  message: string;
  status: number;
  body: any;
}

/** A title that says whose side the problem is on */
export function errorTitle(error: ApiError, fallback: string): string {
  if (error.status === 0) return "The explorer server could not be reached";
  if (error.status === 404 && error.body && error.body.error === "Unknown API endpoint") return "The server needs a restart";
  return fallback;
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch (e: any) {
    if (e && e.name === "AbortError") throw e;
    throw { message: "The explorer server could not be reached.", status: 0, body: null } as ApiError;
  }
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    let message = (body && body.error) || response.statusText || "Request failed";
    //The page asks for something the running server does not have: the server
    //was started before the code it runs from was updated
    if (response.status === 404 && body && body.error === "Unknown API endpoint") {
      message = "The explorer server is older than this page and does not know " + url.split("?")[0] + ". Restart it (npm start).";
    }
    throw { message, status: response.status, body } as ApiError;
  }
  return body as T;
}

export interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Data from the API. `refreshMs` polls; while a refresh runs the previous data
 * stays on screen, so polling never blanks the page. A null url waits.
 */
export function useApi<T>(url: string | null, options: { refreshMs?: number } = {}): ApiState<T> {
  const { refreshMs } = options;
  const [state, setState] = React.useState<{ url: string | null; data: T | null; error: ApiError | null; loading: boolean }>({
    url,
    data: null,
    error: null,
    loading: !!url,
  });
  const [nonce, setNonce] = React.useState(0);

  //Data of another url is never shown, even for the one render before the effect
  if (state.url !== url) {
    setState({ url, data: null, error: null, loading: !!url });
  }

  React.useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    async function load() {
      controller = new AbortController();
      try {
        const data = await getJson<T>(url as string, controller.signal);
        if (!cancelled) setState({ url, data, error: null, loading: false });
      } catch (e: any) {
        if (cancelled || (e && e.name === "AbortError")) return;
        //A failed refresh keeps what was already shown
        setState((previous) => ({ url, data: previous.url === url ? previous.data : null, error: e as ApiError, loading: false }));
      }
      if (!cancelled && refreshMs) timer = setTimeout(load, refreshMs);
    }
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (controller) controller.abort();
    };
  }, [url, refreshMs, nonce]);

  const reload = React.useCallback(() => setNonce((n) => n + 1), []);
  return { data: state.data, error: state.error, loading: state.loading, reload };
}
