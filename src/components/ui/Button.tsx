import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg hover:brightness-95 active:brightness-90",
  secondary: "bg-surface-2 text-fg border border-border hover:bg-surface",
  ghost: "bg-transparent text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-tight transition disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(base, variantClasses[variant], sizeClasses[size], fullWidth && "w-full", className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ButtonLink({ href, variant = "primary", size = "md", fullWidth, className, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(base, variantClasses[variant], sizeClasses[size], fullWidth && "w-full", className)}
    >
      {children}
    </Link>
  );
}
