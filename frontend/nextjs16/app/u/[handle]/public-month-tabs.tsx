import Link from "next/link";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function PublicMonthTabs({
  year,
  month,
  monthsWithLogs,
}: {
  year: number;
  month: number;
  monthsWithLogs: Set<number>;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {MONTH_NAMES.map((name, index) => {
        const monthNumber = index + 1;
        const enabled = monthsWithLogs.has(monthNumber) || monthNumber === month;
        const selected = monthNumber === month;
        const className = `rounded-md border px-2 py-1 text-xs transition-colors ${
          selected
            ? "border-accent bg-accent text-white"
            : enabled
              ? "border-border text-foreground"
              : "border-border text-muted opacity-50"
        }`;

        if (!enabled) {
          return (
            <span key={name} className={className}>
              {name}
            </span>
          );
        }

        return (
          <Link key={name} href={`?year=${year}&month=${monthNumber}`} className={className}>
            {name}
          </Link>
        );
      })}
    </div>
  );
}
