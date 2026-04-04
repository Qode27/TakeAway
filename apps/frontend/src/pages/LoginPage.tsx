import { FormEvent, useState } from "react";
import { ShieldCheck, TimerReset, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthResponse } from "@order-hub/shared";
import { api } from "@/lib/api";
import { setSession } from "@/lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@orderhub.ie");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await api<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setSession(response);
      navigate("/dashboard");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden border-r border-line/80 bg-gradient-to-br from-[#08101a] via-[#0b1423] to-[#121b2d] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <p className="text-xs uppercase tracking-[0.38em] text-orange-300">Order Hub</p>
          <h1 className="mt-5 max-w-lg text-5xl font-semibold leading-tight text-white">
            One clear screen for the entire takeaway operation.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            Built for busy kitchen teams: incoming platform orders, handoff-ready status flow, and fast decision-making during the rush.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-line/80 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-orange-500/15 p-3 text-orange-200">
                <UtensilsCrossed size={18} />
              </span>
              <div>
                <p className="font-medium text-white">Kitchen-first layout</p>
                <p className="text-sm text-slate-400">Fast scan cards, strong contrast, and readable order timers.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-line/80 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-200">
                <TimerReset size={18} />
              </span>
              <div>
                <p className="font-medium text-white">Realtime updates</p>
                <p className="text-sm text-slate-400">New orders surface immediately and status changes feel instant.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-line/80 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-200">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="font-medium text-white">Staff-safe access</p>
                <p className="text-sm text-slate-400">Role-based login with clean internal operations boundaries.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-h-screen place-items-center p-6 sm:p-8">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-[2rem] border border-line/80 bg-panel/92 p-8 shadow-panel backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Order Hub</p>
          <h2 className="mt-3 text-4xl font-semibold text-white">Staff login</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to manage incoming takeaway orders from all connected platforms.</p>

          <label className="mt-8 block text-sm font-medium text-slate-300">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line/90 bg-kitchen px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line/90 bg-kitchen px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
            />
          </label>

          {error ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <button
            disabled={isSubmitting}
            className="mt-6 w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
