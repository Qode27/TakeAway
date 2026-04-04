import { useMemo, useState } from "react";
import { AnalyticsSummary } from "@order-hub/shared";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";
import { Panel } from "@/components/ui/Panel";
import { useAnalytics } from "@/hooks/useOrders";
import { formatMoney } from "@/lib/format";

const platformColors = {
  uber_eats: "#22c55e",
  deliveroo: "#06b6d4",
  just_eat: "#f97316",
  email_fallback: "#94a3b8"
} as const;

export function AnalyticsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading, isError, error } = useAnalytics(from, to);
  const metrics: AnalyticsSummary | undefined = data;

  const revenueData = useMemo(
    () =>
      Object.entries(metrics?.revenueByPlatform ?? {}).map(([platform, revenue]) => ({
        platform,
        revenue
      })),
    [metrics]
  );

  const statusData = useMemo(
    () =>
      Object.entries(metrics?.countsByStatus ?? {}).map(([status, count]) => ({
        status: status.replace("_", " "),
        count
      })),
    [metrics]
  );

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Analytics</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-white">Service performance</h2>
            <p className="mt-2 text-sm text-slate-400">A lightweight operations view focused on platform mix, order volume, and kitchen pace.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-2xl border border-line/90 bg-kitchen px-4 py-3 text-sm text-white" />
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-2xl border border-line/90 bg-kitchen px-4 py-3 text-sm text-white" />
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Orders</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metrics?.totalOrders ?? 0}</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Avg prep</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metrics?.averagePreparationMinutes ?? 0}m</p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Top platform</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {revenueData.length > 0 ? revenueData.sort((a, b) => Number(b.revenue) - Number(a.revenue))[0]?.platform.replace("_", " ") : "N/A"}
          </p>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Top revenue</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {revenueData.length > 0 ? formatMoney(Number([...revenueData].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0]?.revenue ?? 0)) : formatMoney(0)}
          </p>
        </Panel>
      </div>

      {isLoading ? <LoadingState title="Loading analytics..." /> : null}
      {isError ? <ErrorState description={error instanceof Error ? error.message : "Unable to load analytics."} /> : null}
      {!isLoading && !isError && revenueData.length === 0 ? (
        <EmptyState title="No analytics data yet" description="Analytics will populate once orders exist in the selected date range." />
      ) : null}

      {!isLoading && !isError && revenueData.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel className="h-[420px]">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Revenue by platform</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Channel contribution</h3>
            </div>
            <ResponsiveContainer width="100%" height="86%">
              <BarChart data={revenueData} barCategoryGap={28}>
                <CartesianGrid stroke="#223250" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="platform" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Bar dataKey="revenue" radius={[14, 14, 0, 0]}>
                  {revenueData.map((entry) => (
                    <Cell key={entry.platform} fill={platformColors[entry.platform as keyof typeof platformColors] ?? "#f97316"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel className="h-[420px]">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Status mix</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Operational balance</h3>
            </div>
            <ResponsiveContainer width="100%" height="86%">
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={74} outerRadius={122} paddingAngle={4}>
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={["#f97316", "#fb923c", "#38bdf8", "#22c55e", "#94a3b8", "#ef4444"][index % 6]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
