import { useMemo, useState } from "react";
import { BellDot, Filter, Flame, PackageCheck, Salad, Wallet } from "lucide-react";
import { OrderCard as OrderCardType } from "@order-hub/shared";
import { OrdersLane } from "@/components/dashboard/OrdersLane";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";
import { Panel } from "@/components/ui/Panel";
import { useDashboardSummary, useOrders } from "@/hooks/useOrders";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { formatMoney } from "@/lib/format";

export function DashboardPage() {
  useRealtimeOrders();
  const [platform, setPlatform] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [status, setStatus] = useState("");
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorValue
  } = useOrders({
    ...(platform ? { platform } : {}),
    ...(fulfillmentType ? { fulfillmentType } : {}),
    ...(status ? { status } : {})
  });
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();

  const lanes = useMemo(() => {
    const typedOrders = orders as OrderCardType[];
    return {
      new: typedOrders.filter((order) => order.orderStatus === "new"),
      preparing: typedOrders.filter((order) => ["accepted", "preparing"].includes(order.orderStatus)),
      ready: typedOrders.filter((order) => order.orderStatus === "ready"),
      completed: typedOrders.filter((order) => order.orderStatus === "completed")
    };
  }, [orders]);

  const stats = [
    {
      label: "Orders today",
      value: summaryLoading ? "..." : String(summary?.totalOrders ?? 0),
      helper: "Incoming across all channels",
      icon: Salad
    },
    {
      label: "Revenue",
      value: summaryLoading ? "..." : formatMoney(summary?.revenueToday ?? 0),
      helper: "Gross sales today",
      icon: Wallet
    },
    {
      label: "Preparing",
      value: summaryLoading ? "..." : String(summary?.preparingOrders ?? 0),
      helper: "Currently in kitchen flow",
      icon: Flame
    },
    {
      label: "Ready",
      value: summaryLoading ? "..." : String(summary?.readyOrders ?? 0),
      helper: "Awaiting handoff",
      icon: PackageCheck
    }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Kitchen board</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Orders at a glance</h2>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">Fast, clear, ready for service.</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                One dashboard for incoming delivery and pickup orders, built to be understood in seconds during a busy Dublin takeaway rush.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-line/80 bg-kitchen/70 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-orange-500/12 p-2.5 text-orange-200">
                  <BellDot size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">Live incoming feed</p>
                  <p className="text-xs text-slate-400">New orders pulse in place with gentle alerting.</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
            <Filter size={14} />
            Filters
          </div>
          <div className="mt-4 grid gap-3">
            <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="rounded-2xl border border-line/90 bg-kitchen px-4 py-3 text-sm text-white">
              <option value="">All platforms</option>
              <option value="uber_eats">Uber Eats</option>
              <option value="deliveroo">Deliveroo</option>
              <option value="just_eat">Just Eat</option>
            </select>
            <select value={fulfillmentType} onChange={(event) => setFulfillmentType(event.target.value)} className="rounded-2xl border border-line/90 bg-kitchen px-4 py-3 text-sm text-white">
              <option value="">Delivery + pickup</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-line/90 bg-kitchen px-4 py-3 text-sm text-white">
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Panel key={stat.label} className="bg-gradient-to-br from-panel to-panelAlt">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{stat.helper}</p>
                </div>
                <span className="rounded-2xl bg-orange-500/12 p-3 text-orange-200">
                  <Icon size={18} />
                </span>
              </div>
            </Panel>
          );
        })}
      </section>

      {ordersLoading ? <LoadingState title="Loading live kitchen orders..." /> : null}
      {ordersError ? (
        <ErrorState
          description={ordersErrorValue instanceof Error ? ordersErrorValue.message : "Unable to load the dashboard right now."}
          action={
            <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm" onClick={() => window.location.reload()}>
              Refresh screen
            </button>
          }
        />
      ) : null}
      {!ordersLoading && !ordersError && (orders as OrderCardType[]).length === 0 ? (
        <EmptyState
          title="No active orders yet"
          description="When Uber Eats, Deliveroo, Just Eat, or email fallback orders land, they will stream onto this board automatically."
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
        <OrdersLane title="New Orders" orders={lanes.new} />
        <OrdersLane title="Preparing" orders={lanes.preparing} />
        <OrdersLane title="Ready" orders={lanes.ready} />
        <OrdersLane title="Completed" orders={lanes.completed} />
      </section>
    </div>
  );
}
