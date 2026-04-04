import { ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";

export function LoadingState({ title = "Loading..." }: { title?: string }) {
  return (
    <Panel className="border-dashed">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-slate-700" />
        <div className="h-8 w-64 rounded bg-slate-800" />
        <div className="h-24 rounded-3xl bg-slate-900" />
      </div>
      <p className="mt-4 text-sm text-slate-400">{title}</p>
    </Panel>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="border-dashed text-center">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Panel>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="border-rose-500/30 bg-rose-500/10">
      <h3 className="text-xl font-semibold text-rose-100">{title}</h3>
      <p className="mt-3 text-sm text-rose-100/85">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Panel>
  );
}
