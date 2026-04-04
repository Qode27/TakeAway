import { Bike, Mail, ShoppingBag, UtensilsCrossed } from "lucide-react";
import clsx from "clsx";

const styles = {
  uber_eats: "bg-emerald-500/14 text-emerald-100 border-emerald-400/25",
  deliveroo: "bg-cyan-500/14 text-cyan-100 border-cyan-400/25",
  just_eat: "bg-orange-500/14 text-orange-100 border-orange-400/25",
  email_fallback: "bg-slate-500/14 text-slate-100 border-slate-400/25"
};

const icons = {
  uber_eats: Bike,
  deliveroo: ShoppingBag,
  just_eat: UtensilsCrossed,
  email_fallback: Mail
} as const;

export function StatusBadge({ value }: { value: keyof typeof styles }) {
  const Icon = icons[value];
  const label =
    value === "uber_eats" ? "Uber Eats" : value === "just_eat" ? "Just Eat" : value === "email_fallback" ? "Email" : "Deliveroo";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
        styles[value]
      )}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}
