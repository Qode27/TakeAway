import { OrderDetail } from "@order-hub/shared";
import { useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "@/components/ui/DataState";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useOrder } from "@/hooks/useOrders";
import { formatMoney, formatShortTime } from "@/lib/format";

export function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading, isError, error } = useOrder(id);

  if (isLoading) return <LoadingState title="Loading order details..." />;
  if (isError) return <ErrorState description={error instanceof Error ? error.message : "Unable to load order details."} />;
  if (!order) return <Panel>Order not found.</Panel>;

  const typed: OrderDetail = order;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-300">{typed.internalOrderNumber}</p>
            <h2 className="mt-2 text-3xl font-semibold">{typed.customerName ?? "Walk-in customer"}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {typed.fulfillmentType} · {formatShortTime(typed.createdAt)}
            </p>
          </div>
          <StatusBadge value={typed.platform} />
        </div>

        <div className="mt-6 space-y-3">
          {typed.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line bg-panelAlt px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-xs text-slate-400">{item.modifiers.join(", ")}</span>
              </div>
              {item.notes ? <p className="mt-2 text-sm text-orange-200">{item.notes}</p> : null}
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel>
          <h3 className="text-lg font-semibold">Order details</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Phone</dt><dd>{typed.customerPhone ?? "Not provided"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Address</dt><dd className="text-right">{typed.deliveryAddress ?? "Pickup order"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Subtotal</dt><dd>{formatMoney(typed.subtotal)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Tax</dt><dd>{formatMoney(typed.tax)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Delivery fee</dt><dd>{formatMoney(typed.deliveryFee)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-400">Service fee</dt><dd>{formatMoney(typed.serviceFee)}</dd></div>
            <div className="flex justify-between gap-4 text-lg font-semibold"><dt>Total</dt><dd>{formatMoney(typed.total)}</dd></div>
          </dl>
        </Panel>

        <Panel>
          <h3 className="text-lg font-semibold">Event timeline</h3>
          <div className="mt-4 space-y-3">
            {typed.events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-line bg-panelAlt px-4 py-3">
                <p className="font-medium capitalize">{event.type.replace("_", " ")}</p>
                <p className="text-sm text-slate-400">{formatShortTime(event.createdAt)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
