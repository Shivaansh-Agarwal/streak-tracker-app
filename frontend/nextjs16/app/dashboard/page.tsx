"use client";

import { useState } from "react";
import { useGoals } from "@/lib/hooks/useGoals";
import { useLogs } from "@/lib/hooks/useLogs";
import { useHeatmap } from "@/lib/hooks/useHeatmap";
import { useProfile } from "./ProfileContext";
import { ProfileVisibilityToggle } from "./ProfileVisibilityToggle";
import { GoalManager } from "./GoalManager";
import { AddLogForm } from "./AddLogForm";
import { Heatmap } from "./Heatmap";
import { LogList } from "./LogList";
import { MonthTabs } from "./MonthTabs";
import { YearSelect } from "./YearSelect";
import { LogoutButton } from "./LogoutButton";
import { monthsWithLogs } from "@/lib/monthsWithLogs";
import type { LogEntry } from "@/lib/types";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

export default function DashboardPage() {
  const { profile } = useProfile();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const goalsState = useGoals();
  const logsState = useLogs(year, month);
  const heatmapState = useHeatmap(year);

  function refreshLogsAndHeatmap() {
    logsState.refetch();
    heatmapState.refetch();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted">{profile.fullName}</p>
          </div>
          <ProfileVisibilityToggle />
        </div>
        <LogoutButton />
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Goals</h2>
        <GoalManager
          goals={goalsState.goals}
          loading={goalsState.loading}
          error={goalsState.error}
          createGoal={goalsState.createGoal}
          renameGoal={goalsState.renameGoal}
          deleteGoal={goalsState.deleteGoal}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          {editingLog ? "Edit log" : "Add a log"}
        </h2>
        <AddLogForm
          key={editingLog?.id ?? "new"}
          goals={goalsState.goals}
          editingLog={editingLog}
          onDoneEditing={() => setEditingLog(null)}
          onSaved={refreshLogsAndHeatmap}
          createLog={logsState.createLog}
          updateLog={logsState.updateLog}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Heatmap</h2>
          <YearSelect year={year} onChange={setYear} />
        </div>
        <Heatmap
          days={heatmapState.days}
          loading={heatmapState.loading}
          error={heatmapState.error}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Logs</h2>
        <MonthTabs
          month={month}
          monthsWithLogs={monthsWithLogs(heatmapState.days)}
          onChange={setMonth}
        />
        <LogList
          logs={logsState.logs}
          loading={logsState.loading}
          error={logsState.error}
          onEdit={setEditingLog}
          deleteLog={logsState.deleteLog}
          onDeleted={refreshLogsAndHeatmap}
        />
      </section>
    </div>
  );
}
