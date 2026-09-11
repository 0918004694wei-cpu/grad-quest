import type { AppData, AppSettings, Subject, Task, TaskType } from './study-types';
import { seedData } from './study-seed.ts';

export const CURRENT_SCHEMA_VERSION = 3;
export const STORAGE_KEY = 'grad-quest-data';
const LEGACY_KEYS = ['grad-quest-data-v3', 'grad-quest-data-v2', 'grad-quest-data-v1'];

export interface StoredEnvelope { schemaVersion: number; savedAt: string; data: AppData; }
const cloneSeed = () => structuredClone(seedData);
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function mergeSettings(value: unknown, sourceVersion:number): AppSettings {
  const incoming = isObject(value) ? value : {};
  const weeklyTargets = isObject(incoming.weeklyTargets) ? incoming.weeklyTargets : {};
  const wakeOverrides = isObject(incoming.wakeOverrides) ? incoming.wakeOverrides : {};
  const familyVisit = isObject(incoming.familyVisit) ? incoming.familyVisit : {};
  const base = cloneSeed().settings;
  const hasLegacyTargets=sourceVersion<3&&Number(weeklyTargets.economics)===17&&Number(weeklyTargets.finance)===9&&Number(weeklyTargets.statistics)===9.5&&Number(weeklyTargets.english)===3.5;
  return {
    ...base,...incoming,
    weeklyTargets:hasLegacyTargets?base.weeklyTargets:{...base.weeklyTargets,...weeklyTargets},
    maxDailyHours:sourceVersion<3&&Number(incoming.maxDailyHours)===7.5?base.maxDailyHours:Number(incoming.maxDailyHours)||base.maxDailyHours,
    wakeOverrides:{...base.wakeOverrides,...wakeOverrides} as Record<string,string>,
    familyVisit:{...base.familyVisit,...familyVisit},
    schedule:sourceVersion<3?base.schedule:Array.isArray(incoming.schedule)?incoming.schedule as AppSettings['schedule']:base.schedule,
    restWindows:sourceVersion<3?base.restWindows:Array.isArray(incoming.restWindows)?incoming.restWindows as string[]:base.restWindows,
  } as AppSettings;
}

function mergeSubjects(value: unknown): Subject[] {
  const incoming = Array.isArray(value) ? value : [];
  return cloneSeed().subjects.map(base => {
    const saved = incoming.find(item => isObject(item) && item.id === base.id);
    return saved ? { ...base, ...saved } as Subject : base;
  });
}

const legacyTaskIds=new Set(['t1','t2','t3','t4','w1','w2','w3','h1','h2','h3','f1','f2','f3','f4','s1','s2','s3','u1','u2','u3','u4']);
const normalizeTaskType=(value:unknown):TaskType=>value==='questions'?'practice':value==='rest'?'recovery':(['video','practice','review','english','school','recovery','commute','family','weekly-review'].includes(String(value))?value:'review') as TaskType;

function mergeTasks(value: unknown,sourceVersion:number): Task[] {
  if (!Array.isArray(value)) return cloneSeed().tasks;
  const migrated=value.filter(isObject).map((item, index) => ({
    id: typeof item.id === 'string' && item.id ? item.id : `migrated-${index}`,
    date: typeof item.date === 'string' ? item.date : cloneSeed().settings.startDate,
    subjectId: item.subjectId as Task['subjectId'],
    title: typeof item.title === 'string' ? item.title : '未命名任務',
    type: normalizeTaskType(item.type),
    plannedMinutes: Number.isFinite(Number(item.plannedMinutes)) ? Math.max(0, Number(item.plannedMinutes)) : 0,
    actualMinutes: Number.isFinite(Number(item.actualMinutes)) ? Math.max(0, Number(item.actualMinutes)) : 0,
    questionCount: Number.isFinite(Number(item.questionCount)) ? Math.max(0, Number(item.questionCount)) : 0,
    exp: Number.isFinite(Number(item.exp)) ? Math.max(0, Number(item.exp)) : 0,
    priority: (item.priority || 'medium') as Task['priority'],
    mainQuest: Boolean(item.mainQuest),
    completed: Boolean(item.completed),
    scheduledStart: typeof item.scheduledStart === 'string' ? item.scheduledStart : undefined,
    scheduledEnd: typeof item.scheduledEnd === 'string' ? item.scheduledEnd : undefined,
    source: (item.source==='template'?'template':'custom') as Task['source'],
    adjustment: typeof item.adjustment === 'string' ? item.adjustment : undefined,
  }));
  if(sourceVersion>=3)return migrated;
  const legacy=migrated.filter(task=>legacyTaskIds.has(task.id));
  const custom=migrated.filter(task=>!legacyTaskIds.has(task.id));
  const upgraded=cloneSeed().tasks.map(base=>{
    const match=legacy.find(old=>old.date===base.date&&old.subjectId===base.subjectId&&old.type===base.type);
    return match?{...base,completed:match.completed,actualMinutes:match.actualMinutes,questionCount:match.questionCount}:base;
  });
  const historical=legacy.filter(old=>old.completed&&!upgraded.some(next=>next.date===old.date&&next.subjectId===old.subjectId&&next.type===old.type)).map(old=>({...old,source:'custom' as const,scheduledStart:undefined,scheduledEnd:undefined,adjustment:'由舊版保留的已完成紀錄'}));
  return [...upgraded,...historical,...custom];
}

export function migrateData(value: unknown, sourceVersion = 1): AppData {
  if (sourceVersion > CURRENT_SCHEMA_VERSION) throw new Error('此備份來自較新的 App 版本，請先更新 App。');
  if (!isObject(value)) throw new Error('備份格式不正確。');
  const seed = cloneSeed();
  return {
    subjects: mergeSubjects(value.subjects),
    tasks: mergeTasks(value.tasks,sourceVersion),
    sessions: Array.isArray(value.sessions) ? value.sessions as AppData['sessions'] : seed.sessions,
    milestones: Array.isArray(value.milestones) ? value.milestones as AppData['milestones'] : seed.milestones,
    settings: mergeSettings(value.settings,sourceVersion),
    player: isObject(value.player) ? { ...seed.player, ...value.player } as AppData['player'] : seed.player,
    settledWeeks: Array.isArray(value.settledWeeks) ? value.settledWeeks.filter((item): item is string => typeof item === 'string') : seed.settledWeeks,
    generatedScheduleDates: Array.isArray(value.generatedScheduleDates) ? value.generatedScheduleDates.filter((item):item is string=>typeof item==='string') : seed.generatedScheduleDates,
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
