import { clearSession } from "@/lib/auth";
import { ApiResponse } from "@order-hub/shared";

function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (!configuredUrl) return "";

  try {
    const parsedUrl = new URL(configuredUrl, window.location.origin);
    const isConfiguredLocalhost = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
    const isRunningOnLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isConfiguredLocalhost && !isRunningOnLocalhost) {
      return "";
    }
  } catch {
    return "";
  }

  return configuredUrl;
}

const API_URL = resolveApiUrl();

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("orderhub_access_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (response.status === 401) {
    clearSession();
  }

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new Error(body.error.message);
  }

  return body.data;
}
