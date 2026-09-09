import type { AppData, AppSettings, Subject, Task } from './study-types';
import { seedData } from './study-seed.ts';

export const CURRENT_SCHEMA_VERSION = 2;
export const STORAGE_KEY = 'grad-quest-data';
const LEGACY_KEYS = ['grad-quest-data-v3', 'grad-quest-data-v2', 'grad-quest-data-v1'];

export interface StoredEnvelope { schemaVersion: number; savedAt: string; data: AppData; }
const cloneSeed = () => structuredClone(seedData);
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function mergeSettings(value: unknown): AppSettings {
  const incoming = isObject(value) ? value : {};
  const weeklyTargets = isObject(incoming.weeklyTargets) ? incoming.weeklyTargets : {};
  const base = cloneSeed().settings;
  return { ...base, ...incoming, weeklyTargets: { ...base.weeklyTargets, ...weeklyTargets }, schedule: Array.isArray(incoming.schedule) ? incoming.schedule as AppSettings['schedule'] : base.schedule, restWindows: Array.isArray(incoming.restWindows) ? incoming.restWindows as string[] : base.restWindows } as AppSettings;
}

function mergeSubjects(value: unknown): Subject[] {
  const incoming = Array.isArray(value) ? value : [];
  return cloneSeed().subjects.map(base => {
    const saved = incoming.find(item => isObject(item) && item.id === base.id);
    return saved ? { ...base, ...saved } as Subject : base;
  });
}

function mergeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return cloneSeed().tasks;
  return value.filter(isObject).map((item, index) => ({
    id: typeof item.id === 'string' && item.id ? item.id : `migrated-${index}`,
    date: typeof item.date === 'string' ? item.date : cloneSeed().settings.startDate,
    subjectId: item.subjectId as Task['subjectId'],
    title: typeof item.title === 'string' ? item.title : '未命名任務',
    type: (item.type || 'review') as Task['type'],
    plannedMinutes: Number.isFinite(Number(item.plannedMinutes)) ? Math.max(0, Number(item.plannedMinutes)) : 0,
    actualMinutes: Number.isFinite(Number(item.actualMinutes)) ? Math.max(0, Number(item.actualMinutes)) : 0,
    questionCount: Number.isFinite(Number(item.questionCount)) ? Math.max(0, Number(item.questionCount)) : 0,
    exp: Number.isFinite(Number(item.exp)) ? Math.max(0, Number(item.exp)) : 0,
    priority: (item.priority || 'medium') as Task['priority'],
    mainQuest: Boolean(item.mainQuest),
    completed: Boolean(item.completed),
    scheduledStart: typeof item.scheduledStart === 'string' ? item.scheduledStart : undefined,
    scheduledEnd: typeof item.scheduledEnd === 'string' ? item.scheduledEnd : undefined,
  }));
}

export function migrateData(value: unknown, sourceVersion = 1): AppData {
  if (sourceVersion > CURRENT_SCHEMA_VERSION) throw new Error('此備份來自較新的 App 版本，請先更新 App。');
  if (!isObject(value)) throw new Error('備份格式不正確。');
  const seed = cloneSeed();
  return {
    subjects: mergeSubjects(value.subjects),
    tasks: mergeTasks(value.tasks),
    sessions: Array.isArray(value.sessions) ? value.sessions as AppData['sessions'] : seed.sessions,
    milestones: Array.isArray(value.milestones) ? value.milestones as AppData['milestones'] : seed.milestones,
    settings: mergeSettings(value.settings),
    player: isObject(value.player) ? { ...seed.player, ...value.player } as AppData['player'] : seed.player,
    settledWeeks: Array.isArray(value.settledWeeks) ? value.settledWeeks.filter((item): item is string => typeof item === 'string') : seed.settledWeeks,
  };
}

export function parseStoredJson(raw: string): AppData {
  const parsed: unknown = JSON.parse(raw);
  if (isObject(parsed) && 'schemaVersion' in parsed && 'data' in parsed) return migrateData(parsed.data, Number(parsed.schemaVersion) || 1);
  return migrateData(parsed, 1);
}

export function serializeData(data: AppData): string {
  const envelope: StoredEnvelope = { schemaVersion: CURRENT_SCHEMA_VERSION, savedAt: new Date().toISOString(), data };
  return JSON.stringify(envelope, null, 2);
}

export const studyRepository = {
  load(): AppData {
    if (typeof window === 'undefined') return cloneSeed();
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) return parseStoredJson(current);
      for (const key of LEGACY_KEYS) {
        const legacy = localStorage.getItem(key);
        if (legacy) {
          const migrated = parseStoredJson(legacy);
          this.save(migrated);
          return migrated;
        }
      }
    } catch (error) { console.warn('無法讀取本機資料，已載入安全預設值。', error); }
    return cloneSeed();
  },
  save(data: AppData) { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, serializeData(data)); },
  importJson(raw: string): AppData { const migrated = parseStoredJson(raw); this.save(migrated); return migrated; },
  exportJson(data: AppData) { return serializeData(data); },
  clear(): AppData {
    if (typeof window !== 'undefined') { localStorage.removeItem(STORAGE_KEY); LEGACY_KEYS.forEach(key => localStorage.removeItem(key)); }
    return cloneSeed();
  },
};
