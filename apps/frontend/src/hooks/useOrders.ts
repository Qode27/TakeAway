import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnalyticsSummary, OrderCard, OrderDetail, OrderSummary, SettingsDto } from "@order-hub/shared";
import { api } from "@/lib/api";

export function useOrders(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => api<OrderCard[]>(`/api/orders?${new URLSearchParams(filters).toString()}`)
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api<OrderSummary>("/api/dashboard/summary")
  });
}

export function useAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ["analytics", from, to],
    queryFn: () => api<AnalyticsSummary>(`/api/dashboard/analytics?${new URLSearchParams({ from: from ?? "", to: to ?? "" }).toString()}`)
  });
}

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => api<OrderDetail>(`/api/orders/${id}`),
    enabled: Boolean(id)
  });
}

export function useUpdateOrderStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<OrderCard>(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }),
    onMutate: async ({ id, status }) => {
      await client.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = client.getQueriesData<OrderCard[]>({ queryKey: ["orders"] });

      for (const [queryKey, orders] of previousOrders) {
        client.setQueryData<OrderCard[] | undefined>(queryKey, (current) =>
          (current ?? orders)?.map((order) =>
            order.id === id
              ? {
                  ...order,
                  orderStatus: status as OrderCard["orderStatus"],
                  kitchenStatus:
                    status === "accepted" || status === "preparing"
                      ? "preparing"
                      : status === "ready"
                        ? "ready"
                        : status === "completed"
                          ? "completed"
                          : "new"
                }
              : order
          )
        );
      }

      return { previousOrders };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, orders] of context?.previousOrders ?? []) {
        client.setQueryData(queryKey, orders);
      }
    },
    onSuccess: (updatedOrder) => {
      client.setQueryData<OrderDetail | undefined>(["order", updatedOrder.id], (current) =>
        current ? { ...current, ...updatedOrder } : current
      );
      client.invalidateQueries({ queryKey: ["orders"] });
      client.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api<SettingsDto>("/api/settings")
  });
}
