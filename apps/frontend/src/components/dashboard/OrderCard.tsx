import { Clock3, Flame, Store, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { OrderCard as OrderCardType } from "@order-hub/shared";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { elapsedMinutes, formatMoney, formatShortTime } from "@/lib/format";

const nextActionMap: Record<string, { label: string; next: string } | null> = {
  new: { label: "Accept", next: "accepted" },
  accepted: { label: "Preparing", next: "preparing" },
  preparing: { label: "Ready", next: "ready" },
  ready: { label: "Complete", next: "completed" },
  completed: null,
  cancelled: null
};

export function OrderCard({ order }: { order: OrderCardType }) {
  const navigate = useNavigate();
  const mutation = useUpdateOrderStatus();
  const age = elapsedMinutes(order.createdAt);
  const action = nextActionMap[order.orderStatus];
  const urgencyTone = age >= 30 ? "critical" : age >= 18 ? "warning" : "normal";
  const [isFresh, setIsFresh] = useState(age <= 1);

  useEffect(() => {
    if (!isFresh) return;
    const timer = window.setTimeout(() => setIsFresh(false), 3500);
    return () => window.clearTimeout(timer);
  }, [isFresh]);

  const timerStyle =
    urgencyTone === "critical"
      ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
      : urgencyTone === "warning"
        ? "border-amber-400/35 bg-amber-500/12 text-amber-100"
        : "border-line bg-surface/60 text-slate-200";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/orders/${order.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/orders/${order.id}`);
        }
      }}
      className={`w-full cursor-pointer rounded-[1.6rem] border p-4 text-left transition duration-200 ${
        urgencyTone === "critical"
          ? "border-rose-400/35 bg-gradient-to-b from-rose-500/10 to-panelAlt hover:border-rose-300/45"
          : "border-line bg-gradient-to-b from-white/[0.02] to-panelAlt hover:border-orange-400/35"
      } ${isFresh ? "lane-highlight" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">{order.internalOrderNumber}</p>
          <p className="mt-2 text-xl font-semibold text-white">{order.customerName ?? "Walk-in customer"}</p>
        </div>
        <StatusBadge value={order.platform} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm text-slate-300">
        <span className="inline-flex items-center gap-2">
          {order.fulfillmentType === "delivery" ? <Truck size={15} /> : <Store size={15} />}
          <span className="capitalize">{order.fulfillmentType}</span>
        </span>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${timerStyle}`}>
          <Clock3 size={15} />
          {formatShortTime(order.createdAt)} · {age}m
        </span>
        {urgencyTone !== "normal" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-100">
            <Flame size={12} />
            {urgencyTone === "critical" ? "Urgent" : "Watch"}
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-2.5">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded-2xl bg-surface/60 px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium text-slate-100">
                {item.quantity}x {item.name}
              </span>
              {item.modifiers.length > 0 ? (
                <span className="max-w-[42%] text-right text-xs leading-5 text-slate-400">{item.modifiers.join(", ")}</span>
              ) : null}
            </div>
            {item.notes ? <p className="mt-1.5 text-xs text-orange-200">{item.notes}</p> : null}
          </div>
        ))}
        {order.items.length > 3 ? <p className="px-1 text-xs text-slate-500">+{order.items.length - 3} more items</p> : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{order.itemCount} items</p>
          <p className="mt-1 text-2xl font-semibold text-white">{formatMoney(order.total)}</p>
        </div>

        {action ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              mutation.mutate({ id: order.id, status: action.next });
            }}
            disabled={mutation.isPending}
            className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? "Updating..." : action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
