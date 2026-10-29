"use client";

type SpinnerProps = Readonly<{
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}>;

export function Spinner({ size = "md", label, className = "" }: SpinnerProps) {
  return (
    <span
      className={`spinner spinner--${size}${className ? ` ${className}` : ""}`}
      role="status"
      aria-label={label ?? "Loading"}
    />
  );
}

type PageLoaderProps = Readonly<{
  label?: string;
  brand?: boolean;
}>;

export function PageLoader({ label = "Loading…", brand = false }: PageLoaderProps) {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-busy="true">
      {brand ? <p className="page-loader__brand">Daybook</p> : null}
      <Spinner size="lg" label={label} />
      <p className="page-loader__label">{label}</p>
    </div>
  );
}
