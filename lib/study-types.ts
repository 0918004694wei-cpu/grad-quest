export type SubjectId = 'economics' | 'finance' | 'statistics' | 'english';
export type TaskType = 'video' | 'review' | 'questions' | 'english' | 'school' | 'rest';
export type Priority = 'high' | 'medium' | 'low';

export interface Subject {
  id: SubjectId; name: string; shortName: string; color: string; originalVideoHours: number;
  completedOriginalHours: number; speed: number; reviewHours: number; questions: number;
  wrongQuestions: number; pastPapers: number; exp: number;
}
export interface Task {
  id: string; date: string; subjectId?: SubjectId; title: string; type: TaskType; plannedMinutes: number;
  actualMinutes: number; questionCount: number; exp: number; priority: Priority; mainQuest: boolean;
  completed: boolean; scheduledStart?: string; scheduledEnd?: string;
}
export interface DailyProgress { date: string; completedTaskIds: string[]; coreCompletionRate: number; rating: '未通關'|'Pass'|'Great'|'Perfect'; }
export interface WeeklyProgress { weekStart: string; subjectVideoHours: Partial<Record<SubjectId, number>>; reviewQuestionHours: number; englishHours: number; completionRate: number; settled: boolean; }
export interface StudySession { id: string; taskId: string; subjectId?: SubjectId; date: string; minutes: number; type: TaskType; }
export interface Milestone { id: string; date: string; title: string; targetPercent: number; description: string; }
export interface ScheduleBlock { id: string; weekday: number; title: string; start: string; end: string; }
export interface AppSettings { startDate: string; phaseDeadline: string; videoDeadline: string; examDate: string; passPercent: number; expMultiplier: number; maxDailyHours: number; weeklyTargets: Record<SubjectId, number>; restWindows: string[]; schedule: ScheduleBlock[]; }
export interface PlayerProfile { name: string; exp: number; coins: number; streak: number; }
export interface AppData { subjects: Subject[]; tasks: Task[]; sessions: StudySession[]; milestones: Milestone[]; settings: AppSettings; player: PlayerProfile; settledWeeks: string[]; }
