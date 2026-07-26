export type UserStatus = "PENDING_PROFILE" | "ACTIVE";

export type Profile = {
  username: string | null;
  fullName: string | null;
  profilePictureUrl: string | null;
  status: UserStatus;
  isPublic: boolean;
};

export type Goal = {
  id: number;
  title: string;
};

export type LogEntry = {
  id: number;
  goalId: number;
  goalTitle: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  logDate: string;
};

export type HeatmapDay = {
  date: string;
  hours: number;
};
