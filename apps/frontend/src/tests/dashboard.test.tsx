import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "@/pages/DashboardPage";

vi.mock("@/hooks/useOrders", () => ({
  useOrders: () => ({
    data: [
      {
        id: "1",
        internalOrderNumber: "OH-260402-1234",
        externalOrderId: "ext-1",
        platform: "uber_eats",
        customerName: "Sarah Byrne",
        fulfillmentType: "delivery",
        total: 31.55,
        orderStatus: "new",
        kitchenStatus: "new",
        createdAt: new Date().toISOString(),
        orderNotes: "Call on arrival",
        itemCount: 2,
        items: [{ id: "i1", name: "Doner Kebab Meal", quantity: 1, notes: "", modifiers: [] }]
      }
    ]
  }),
  useDashboardSummary: () => ({
    data: { totalOrders: 3, revenueToday: 90.23, preparingOrders: 1, readyOrders: 1 }
  }),
  useUpdateOrderStatus: () => ({ mutate: vi.fn() })
}));

vi.mock("@/hooks/useRealtimeOrders", () => ({
  useRealtimeOrders: () => undefined
}));

describe("DashboardPage", () => {
  it("renders key dashboard sections", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Orders at a glance")).toBeInTheDocument();
    expect(screen.getByText("New Orders")).toBeInTheDocument();
    expect(screen.getByText("Sarah Byrne")).toBeInTheDocument();
  });
});
