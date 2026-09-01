const colors: Record<string, string> = {
  PAID: "bg-success/15 text-success",
  PENDING: "bg-warning/15 text-warning",
  EXPIRED: "bg-muted/15 text-muted",
  FAILED: "bg-danger/15 text-danger",
  CANCELED: "bg-muted/15 text-muted",
  REFUNDED: "bg-danger/15 text-danger",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors[status] || "bg-muted/15 text-muted"}`}>
      {status}
    </span>
  );
}
