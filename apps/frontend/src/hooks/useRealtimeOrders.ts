import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OrderCard } from "@order-hub/shared";
import { io } from "socket.io-client";

function resolveSocketUrl() {
  const configuredUrl = import.meta.env.VITE_SOCKET_URL?.trim();
  if (!configuredUrl) return window.location.origin;

  try {
    const parsedUrl = new URL(configuredUrl, window.location.origin);
    const isConfiguredLocalhost = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
    const isRunningOnLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isConfiguredLocalhost && !isRunningOnLocalhost) {
      return window.location.origin;
    }
  } catch {
    return window.location.origin;
  }

  return configuredUrl;
}

const socketUrl = resolveSocketUrl();
const defaultSoundEnabled = (import.meta.env.VITE_ENABLE_SOUND_DEFAULT ?? "true") === "true";

export function useRealtimeOrders() {
  const client = useQueryClient();

  useEffect(() => {
    const socket = io(socketUrl, { transports: ["websocket"] });
    let audioContext: AudioContext | null = null;
    let lastAlertAt = 0;

    const playAlert = () => {
      const soundPreference = localStorage.getItem("orderhub_sound");
      const soundEnabled = soundPreference ? soundPreference !== "off" : defaultSoundEnabled;
      if (!soundEnabled) return;
      if (Date.now() - lastAlertAt < 8000) return;
      lastAlertAt = Date.now();
      audioContext ??= new window.AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.18);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.018, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    };

    const updateOrderCaches = (incomingOrder: OrderCard, isNew: boolean) => {
      client.setQueriesData<OrderCard[]>({ queryKey: ["orders"] }, (current = []) => {
        const next = current.filter((order) => order.id !== incomingOrder.id);
        return [incomingOrder, ...next];
      });
      client.setQueryData(["order", incomingOrder.id], (current: unknown) =>
        current && typeof current === "object" ? { ...(current as Record<string, unknown>), ...incomingOrder } : current
      );
    };

    const onNewOrder = (payload: OrderCard) => {
      playAlert();
      updateOrderCaches(payload, true);
      client.invalidateQueries({ queryKey: ["orders"] });
      client.invalidateQueries({ queryKey: ["dashboard-summary"] });
    };

    const onUpdate = (payload: OrderCard) => {
      updateOrderCaches(payload, false);
      client.invalidateQueries({ queryKey: ["orders"] });
      client.invalidateQueries({ queryKey: ["dashboard-summary"] });
    };

    socket.on("orders:new", onNewOrder);
    socket.on("orders:updated", onUpdate);

    return () => {
      socket.off("orders:new", onNewOrder);
      socket.off("orders:updated", onUpdate);
      socket.close();
    };
  }, [client]);
}
