import { SettingsDto } from "@order-hub/shared";
import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/ui/DataState";
import { Panel } from "@/components/ui/Panel";
import { useSettings } from "@/hooks/useOrders";
import { getSoundPreference, setSoundPreference } from "@/lib/auth";

export function SettingsPage() {
  const { data, isLoading, isError, error } = useSettings();
  const store: SettingsDto | undefined = data ?? undefined;
  const [soundPreference, setLocalSoundPreference] = useState(getSoundPreference() === "off" ? "off" : "on");

  if (isLoading) return <LoadingState title="Loading store settings..." />;
  if (isError) return <ErrorState description={error instanceof Error ? error.message : "Unable to load settings."} />;

  return (
    <div className="space-y-6">
      <Panel>
        <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold">Store configuration</h2>
        <p className="mt-2 text-sm text-slate-400">This MVP exposes operational settings and platform connection placeholders for rollout.</p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h3 className="text-lg font-semibold">Store profile</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Name</dt><dd>{store?.name ?? "Not configured"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Timezone</dt><dd>{store?.timezone ?? "Europe/Dublin"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Currency</dt><dd>{store?.currency ?? "EUR"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Alerts</dt><dd>{store?.alertSoundEnabled ? "Enabled" : "Disabled"}</dd></div>
          </dl>
        </Panel>

        <Panel>
          <h3 className="text-lg font-semibold">Kitchen display</h3>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-panelAlt px-4 py-3">
            <div>
              <p className="font-medium">New order alert sound</p>
              <p className="text-sm text-slate-400">Short chime with cooldown to avoid repeated noise during bursts.</p>
            </div>
            <button
              className="rounded-2xl border border-line px-4 py-2 text-sm"
              onClick={() => {
                const nextValue = soundPreference === "on" ? "off" : "on";
                setLocalSoundPreference(nextValue);
                setSoundPreference(nextValue);
              }}
            >
              {soundPreference === "on" ? "On" : "Off"}
            </button>
          </div>
        </Panel>

        <Panel>
          <h3 className="text-lg font-semibold">Platform connections</h3>
          <div className="mt-4 space-y-3">
            {(store?.platformConnections ?? []).map((connection) => (
              <div key={connection.id} className="rounded-2xl border border-line bg-panelAlt px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium uppercase">{connection.platform.replace("_", " ")}</span>
                  <span className="text-xs text-slate-400">{connection.isEnabled ? "Enabled" : "Disabled"}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">Store ID: {connection.externalStoreId}</p>
                <p className="mt-1 text-sm text-slate-400">Fallback: {connection.usesEmailFallback ? "Email enabled" : "Direct only"}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
