import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`surface-card rounded-[1.35rem] p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary:
      "bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.7)] hover:from-sky-400 hover:to-blue-500 disabled:from-sky-300 disabled:to-blue-300 disabled:shadow-none",
    secondary:
      "bg-white/90 text-sky-900 border border-sky-200 hover:bg-sky-50 hover:border-sky-300",
    danger:
      "bg-rose-500 text-white hover:bg-rose-600 shadow-[0_8px_18px_-12px_rgba(244,63,94,0.7)]",
    ghost: "bg-transparent text-sky-800 hover:bg-sky-100/70",
  }[variant];

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold tracking-wide transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed sm:py-2.5 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-semibold text-sky-900/80">{label}</span>
      )}
      <input
        className={`w-full min-h-12 rounded-2xl border border-sky-200/90 bg-white/90 px-3.5 py-3 text-base text-sky-950 outline-none transition placeholder:text-sky-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-200/60 sm:min-h-11 sm:py-2.5 sm:text-sm ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-semibold text-sky-900/80">{label}</span>
      )}
      <select
        className={`w-full min-h-12 rounded-2xl border border-sky-200/90 bg-white/90 px-3.5 py-3 text-base text-sky-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200/60 sm:min-h-11 sm:py-2.5 sm:text-sm ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-semibold text-sky-900/80">{label}</span>
      )}
      <textarea
        className={`w-full rounded-2xl border border-sky-200/90 bg-white/90 px-3.5 py-3 text-base text-sky-950 outline-none transition placeholder:text-sky-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-200/60 sm:text-sm ${className}`}
        {...props}
      />
    </label>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[1.45rem] font-semibold tracking-tight text-sky-950 sm:text-[1.85rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-sky-700/70">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap [&_a]:block [&_a]:w-full sm:[&_a]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  const styles = {
    error: "border-rose-200/80 bg-rose-50 text-rose-700",
    success: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    info: "border-sky-200/80 bg-sky-50 text-sky-800",
  }[tone];
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}
