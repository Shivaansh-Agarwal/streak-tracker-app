const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function MonthTabs({
  month,
  monthsWithLogs,
  onChange,
}: {
  month: number;
  monthsWithLogs: Set<number>;
  onChange: (month: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {MONTH_NAMES.map((name, index) => {
        const monthNumber = index + 1;
        const enabled = monthsWithLogs.has(monthNumber) || monthNumber === month;
        const selected = monthNumber === month;
        return (
          <button
            key={name}
            type="button"
            disabled={!enabled}
            onClick={() => onChange(monthNumber)}
            className={`rounded-md border px-2 py-1 text-xs transition-colors ${
              selected
                ? "border-accent bg-accent text-white"
                : "border-border text-foreground disabled:text-muted disabled:opacity-50"
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
