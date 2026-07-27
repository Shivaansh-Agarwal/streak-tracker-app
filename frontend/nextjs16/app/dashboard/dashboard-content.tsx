"use client";

import { useRef, useState } from "react";
import useGoals from "@/app/dashboard/utils/use-goals";
import { useLogs } from "@/app/dashboard/utils/use-logs";
import useHeatmap from "@/app/dashboard/utils/use-heatmap";
import ProfileVisibilityToggle from "./profile-visibility-toggle";
import GoalManager from "./goal-manager";
import Modal from "@/components/modal";
import AddLogForm from "./add-log-form";
import HeatmapByMonth from "@/components/heatmap/heatmap-by-month";
import LogList from "./log-list";
import MonthTabs from "./month-tabs";
import YearSelect from "./year-select";
import LogoutButton from "./logout-button";
import monthsWithLogs from "@/lib/months-with-logs";
import type { LogEntry, Profile } from "@/lib/types";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

export default function DashboardContent({ profile: initialProfile }: { profile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const editLogSectionRef = useRef<HTMLElement>(null);

  const goalsState = useGoals();
  const logsState = useLogs(year, month);
  const heatmapState = useHeatmap(year);

  function refreshLogsAndHeatmap() {
    logsState.refetch();
    heatmapState.refetch();
  }

  function handleEditLog(log: LogEntry) {
    setEditingLog(log);
    editLogSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted">{profile.fullName}</p>
          </div>
          <ProfileVisibilityToggle profile={profile} setProfile={setProfile} />
        </div>
        <LogoutButton />
      </header>

      <section
        ref={editLogSectionRef}
        className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm"
      >
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

      <section className="flex items-center justify-between rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Goals</h2>
        <button
          onClick={() => setGoalsModalOpen(true)}
          className="rounded-md bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover"
        >
          Manage goals
        </button>
      </section>

      <Modal
        open={goalsModalOpen}
        onClose={() => setGoalsModalOpen(false)}
        title="Manage goals"
      >
        <GoalManager
          goals={goalsState.goals}
          loading={goalsState.loading}
          error={goalsState.error}
          createGoal={goalsState.createGoal}
          renameGoal={goalsState.renameGoal}
          deleteGoal={goalsState.deleteGoal}
        />
      </Modal>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Heatmap</h2>
          <YearSelect year={year} onChange={setYear} />
        </div>
        <HeatmapByMonth
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
          onEdit={handleEditLog}
          deleteLog={logsState.deleteLog}
          onDeleted={refreshLogsAndHeatmap}
        />
      </section>
    </div>
  );
}
