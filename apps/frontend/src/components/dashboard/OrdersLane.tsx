import { OrderCard as OrderCardType } from "@order-hub/shared";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/DataState";

export function OrdersLane({
  title,
  orders
}: {
  title: string;
  orders: OrderCardType[];
}) {
  return (
    <Panel className="min-h-[420px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Live kitchen lane</p>
        </div>
        <span className="rounded-full border border-line/80 bg-kitchen px-3 py-1 text-xs text-slate-300">{orders.length}</span>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <EmptyState
            title={`No ${title.toLowerCase()}`}
            description="This lane is clear right now. New orders will appear here automatically."
          />
        ) : null}
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </Panel>
  );
}
