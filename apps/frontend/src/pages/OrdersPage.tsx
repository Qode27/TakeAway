import { useMemo, useState } from "react";
import { OrderCard } from "@order-hub/shared";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useOrders } from "@/hooks/useOrders";
import { formatMoney, formatShortTime } from "@/lib/format";

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const { data: orders = [], isLoading, isError, error } = useOrders(search ? { search } : {});

  const rows = useMemo(() => orders as OrderCard[], [orders]);

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Orders</p>
            <h2 className="mt-2 text-3xl font-semibold">Full order stream</h2>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer, platform"
            className="w-full max-w-sm rounded-2xl border border-line bg-surface px-4 py-3 text-sm"
          />
        </div>
      </Panel>

      {isLoading ? <LoadingState title="Loading order list..." /> : null}
      {isError ? <ErrorState description={error instanceof Error ? error.message : "Unable to load orders."} /> : null}
      {!isLoading && !isError && rows.length === 0 ? (
        <EmptyState title="No orders found" description="Try widening the search or wait for the next platform order to arrive." />
      ) : null}

      {!isLoading && !isError && rows.length > 0 ? (
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-panelAlt text-left text-slate-400">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((order) => (
              <tr key={order.id} className="hover:bg-panelAlt/60">
                <td className="px-4 py-4 font-medium">
                  <Link to={`/orders/${order.id}`} className="text-orange-200 hover:text-orange-100">
                    {order.internalOrderNumber}
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge value={order.platform} />
                </td>
                <td className="px-4 py-4">{order.customerName ?? "Walk-in"}</td>
                <td className="px-4 py-4 capitalize">{order.fulfillmentType}</td>
                <td className="px-4 py-4 capitalize">{order.orderStatus.replace("_", " ")}</td>
                <td className="px-4 py-4">{formatShortTime(order.createdAt)}</td>
                <td className="px-4 py-4">{formatMoney(order.total)}</td>
              </tr>
            ))}
          </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
