import assert from 'node:assert/strict';
import { seedData } from '../lib/study-seed.ts';
import { backlogFor, clamp, dailyRating, daysUntil, studyStreak, subjectTotals, weekRange } from '../lib/study-calculations.ts';
import { CURRENT_SCHEMA_VERSION, migrateData, parseStoredJson, serializeData } from '../lib/study-storage.ts';

const clone = value => structuredClone(value);
const complete = clone(seedData);
complete.tasks = complete.tasks.map(task => task.id === 't2' ? { ...task, completed: true } : task);
const finance = complete.subjects.find(subject => subject.id === 'finance');
assert.equal(subjectTotals(complete, finance).completedOriginalHours, 3.75, '1.25× 影片換算應正確');
assert.equal(dailyRating(complete.tasks.filter(task => task.date === '2026-09-08'), 70).rate, 50, '核心任務完成率應正確');

const undone = clone(seedData);
assert.equal(subjectTotals(undone, undone.subjects.find(subject => subject.id === 'finance')).completedOriginalHours, 0, '取消完成需完整回復進度');
const deleted = { ...complete, tasks: complete.tasks.filter(task => task.id !== 't2') };
assert.equal(subjectTotals(deleted, deleted.subjects.find(subject => subject.id === 'finance')).completedOriginalHours, 0, '刪除已完成任務需回復進度');

const behind = backlogFor(seedData, seedData.subjects[0], new Date('2026-10-08'));
assert.ok(behind.behind > 0 && behind.extraPerWeek > 0, '落後量需平均攤至剩餘週數');
const aheadData = clone(seedData); aheadData.subjects[0].completedOriginalHours = 100;
assert.ok(backlogFor(aheadData, aheadData.subjects[0], new Date('2026-10-08')).ahead > 0, '超前狀態需可辨識');
assert.deepEqual(weekRange(new Date('2026-09-13')), { start: '2026-09-07', end: '2026-09-13' }, '跨週邊界需以星期一為起點');
assert.equal(daysUntil('2026-12-25', new Date('2027-01-01')), 0, '截止日後倒數不可為負');
assert.equal(clamp(Number.NaN), 0, 'NaN 應安全降為 0');

const streakTasks = [
  { ...seedData.tasks[0], id: 'streak-1', date: '2026-09-07', completed: true },
  { ...seedData.tasks[0], id: 'streak-2', date: '2026-09-08', completed: true },
];
assert.equal(studyStreak(streakTasks, 70, new Date('2026-09-08T12:00:00')), 2, '連續通關日應由持久化任務紀錄重建');

const backup = serializeData(complete);
const restored = parseStoredJson(backup);
assert.equal(JSON.parse(backup).schemaVersion, CURRENT_SCHEMA_VERSION, 'JSON 備份需包含 schemaVersion');
assert.equal(restored.tasks.find(task => task.id === 't2').completed, true, '匯入備份需恢復任務完成狀態');
const customBackupData = clone(complete);
customBackupData.tasks.push({ ...seedData.tasks[0], id: 'custom-task', title: '自訂題目與複習', type: 'questions', questionCount: 42, actualMinutes: 75 });
customBackupData.settings.passPercent = 77;
customBackupData.player.exp = 321;
customBackupData.settledWeeks.push('2026-09-07');
const customRestored = parseStoredJson(serializeData(customBackupData));
assert.deepEqual(customRestored.tasks.find(task => task.id === 'custom-task'), customBackupData.tasks.at(-1), '自訂任務、題數與複習時數欄位需完整往返');
assert.equal(customRestored.settings.passPercent, 77, 'Settings 需完整往返');
assert.equal(customRestored.player.exp, 321, '基礎 EXP 需完整往返');
assert.deepEqual(customRestored.settledWeeks, ['2026-09-07'], 'Weekly 結算狀態需完整往返');
const legacy = migrateData({ ...seedData, settings: { passPercent: 80 } }, 1);
assert.equal(legacy.settings.passPercent, 80, '舊版資料需保留已有欄位');
assert.ok(legacy.settings.weeklyTargets, '舊版資料缺少的新欄位需由 migration 補齊');
console.log('All study-app invariants passed.');
