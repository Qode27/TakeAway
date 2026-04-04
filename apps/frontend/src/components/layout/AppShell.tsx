import { ChartColumn, LayoutDashboard, ListOrdered, LogOut, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { clearSession, getUser } from "@/lib/auth";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Orders", icon: ListOrdered },
  { to: "/analytics", label: "Analytics", icon: ChartColumn },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function AppShell() {
  const user = getUser();

  return (
    <div className="min-h-screen bg-surface text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-line/80 bg-panel/84 p-4 backdrop-blur lg:border-b-0 lg:border-r lg:p-6">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.38em] text-orange-300">Order Hub</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Takeaway Ops</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">A calm, kitchen-friendly command view for multi-platform service.</p>
          </div>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[1.15rem] px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-orange-500/14 text-orange-100 shadow-glow"
                        : "text-slate-300 hover:bg-panelAlt/95 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[1.5rem] border border-line/80 bg-gradient-to-b from-panelAlt to-kitchen p-4 lg:mt-10">
            <p className="text-sm font-medium text-white">{user?.fullName ?? "Staff User"}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-500">{user?.role ?? "kitchen_staff"}</p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/70"
              onClick={() => {
                clearSession();
                window.location.href = "/login";
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="p-4 md:p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
