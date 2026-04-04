import { PropsWithChildren } from "react";
import clsx from "clsx";

export function Panel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        "rounded-[1.75rem] border border-line/90 bg-panel/88 p-5 shadow-panel backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
