import assert from 'node:assert/strict';
import { seedData } from '../lib/study-seed.ts';
import { backlogFor, catchUpPlan, clamp, daysUntil, studyStreak, subjectTotals, weekRange, weeklyRank, weeklyStats } from '../lib/study-calculations.ts';
import { familyVisitPhase, generateDailySchedule, generateWeekSchedule, isLearningTask, weekTypeFor } from '../lib/study-schedule.ts';
import { CURRENT_SCHEMA_VERSION, migrateData, parseStoredJson, serializeData } from '../lib/study-storage.ts';

const clone=value=>structuredClone(value);
const at=value=>{const [h,m]=value.split(':').map(Number);return h*60+m};
const overlaps=(task,start,end)=>task.scheduledStart&&task.scheduledEnd&&at(task.scheduledStart)<at(end)&&at(task.scheduledEnd)>at(start);

// 1. 一般星期三：10:00 前沒有高強度任務，每天最多兩個主科。
const normalSettings=clone(seedData.settings);
const wednesday=generateDailySchedule('2026-09-09',normalSettings);
assert.ok(wednesday.some(t=>t.title==='統計影片'&&t.scheduledStart==='10:00'),'星期三應於 10:00 開始統計影片');
assert.equal(new Set(wednesday.filter(isLearningTask).map(t=>t.subjectId).filter(id=>id!=='english')).size,2,'每天最多兩個主要研究所科目');
assert.ok(wednesday.filter(t=>isLearningTask(t)&&t.priority==='high'&&t.scheduledStart).every(t=>t.scheduledStart>='10:00'),'無早課日 10:00 前不得安排高強度任務');

// 2. 星期一早課與特殊起床。
const monday=generateDailySchedule('2026-09-07',normalSettings);
assert.ok(monday.some(t=>t.title==='起床與晨間準備'&&t.scheduledStart==='08:00'),'星期一應採 08:00 特殊起床');
assert.ok(monday.some(t=>t.title==='最優化理論'&&t.scheduledStart==='09:00'&&t.scheduledEnd==='12:00'),'星期一早課需保留');
assert.ok(!monday.some(t=>isLearningTask(t)&&t.scheduledStart&&t.scheduledStart<'14:00'),'星期一上午不得安排研究所讀書');

// 3. 午餐＋午休固定兩小時，任何讀書任務不得重疊。
for(const date of ['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-09-13']){
  const tasks=generateDailySchedule(date,normalSettings);
  assert.ok(tasks.some(t=>t.type==='recovery'&&t.scheduledStart==='12:00'&&t.scheduledEnd==='14:00'),'每日需保留午餐午休 Block');
  assert.ok(!tasks.some(t=>isLearningTask(t)&&overlaps(t,'12:00','14:00')),'午餐午休不得排入學習任務');
  assert.ok(!tasks.some(t=>isLearningTask(t)&&t.priority==='high'&&t.scheduledEnd&&t.scheduledEnd>'22:00'),'22:00 後不得安排高強度任務');
}
const normalWeekTasks=generateWeekSchedule('2026-09-07',normalSettings);const normalGradHours=normalWeekTasks.filter(t=>isLearningTask(t)&&t.type!=='english').reduce((sum,t)=>sum+t.plannedMinutes/60,0);const normalEnglishHours=normalWeekTasks.filter(t=>t.type==='english').reduce((sum,t)=>sum+t.plannedMinutes/60,0);
assert.ok(normalGradHours>=34&&normalGradHours<=35,'一般週研究所排程應約 34–35 小時');assert.ok(normalEnglishHours>=2.5&&normalEnglishHours<=3,'英文每週應約 2.5–3 小時');

// 4. 晚起 11:00：Main Quest 保留、Side Quest 可縮減，不排到深夜，通關線放寬。
const lateSettings=clone(normalSettings);lateSettings.wakeOverrides['2026-09-09']='11:00';
const lateWednesday=generateDailySchedule('2026-09-09',lateSettings);
assert.equal(lateWednesday.filter(t=>t.mainQuest).length,wednesday.filter(t=>t.mainQuest).length,'晚起仍需保留 Main Quest');
assert.ok(lateWednesday.some(t=>t.adjustment?.includes('不補到深夜')),'晚起任務需標示彈性調整');
assert.ok(!lateWednesday.some(t=>isLearningTask(t)&&t.scheduledEnd&&t.scheduledEnd>'21:30'),'晚起缺口不得補到深夜');

// 5. 雨天模式：通勤 30 分鐘，午休與睡眠不壓縮。
const rainySettings=clone(normalSettings);rainySettings.rainyDayMode=true;
const rainyThursday=generateDailySchedule('2026-09-10',rainySettings);
assert.ok(rainyThursday.some(t=>t.type==='commute'&&t.plannedMinutes===30&&t.title.includes('雨天')),'雨天通勤應為 30 分鐘');
assert.ok(rainyThursday.some(t=>t.title==='買午餐＋午餐＋午休'&&t.plannedMinutes===120),'雨天仍須完整保留午休');

// 6–8. 返鄉週四、週五與 Family Visit Day。
const familySettings=clone(normalSettings);familySettings.familyVisit={enabled:true,startDate:'2026-09-10',endDate:'2026-09-13',currentWeek:false};
const familyThursday=generateDailySchedule('2026-09-10',familySettings);
assert.equal(familyVisitPhase(familySettings,'2026-09-10'),'新竹 → 台中');
assert.ok(familyThursday.some(t=>t.type==='commute'&&t.title.includes('新竹 → 台中')),'週四課後需安排返鄉通勤');
assert.ok(!familyThursday.some(t=>isLearningTask(t)&&t.scheduledStart&&t.scheduledStart>='17:20'),'返鄉週四晚間不排主要研究所任務');
const familyFriday=generateDailySchedule('2026-09-11',familySettings);
assert.ok(familyFriday.some(t=>t.type==='commute'&&t.title.includes('台中 → 田中')),'週五需安排台中到田中');
assert.ok(familyFriday.filter(isLearningTask).reduce((s,t)=>s+t.plannedMinutes,0)>=120&&familyFriday.filter(isLearningTask).reduce((s,t)=>s+t.plannedMinutes,0)<=180,'返鄉週五學習量應為 2–3 小時');
const familySaturday=generateDailySchedule('2026-09-12',familySettings);
assert.ok(familySaturday.some(t=>t.type==='family'),'星期六需以 Family 為主要行程');
assert.ok(familySaturday.filter(isLearningTask).reduce((s,t)=>s+t.plannedMinutes,0)>=30&&familySaturday.filter(isLearningTask).reduce((s,t)=>s+t.plannedMinutes,0)<=90,'星期六最低學習應為 30–90 分鐘');

// 9. Family Visit Weekly Quest 按動態降低後目標評級。
const familyData=clone(seedData);familyData.settings=familySettings;familyData.tasks=generateWeekSchedule('2026-09-07',familySettings);
familyData.tasks.push({id:'family-actual',date:'2026-09-09',subjectId:'economics',title:'本週實際投入',type:'review',plannedMinutes:1530,actualMinutes:1530,questionCount:0,exp:0,priority:'medium',mainQuest:false,completed:true,source:'custom'});
const familyWeek=weeklyStats(familyData,new Date('2026-09-11T12:00:00'));
assert.equal(familyWeek.type,'family');assert.ok(familyWeek.targetStudyHours>=25&&familyWeek.targetStudyHours<=29,'典型返鄉週目標應動態落在約 25–29 小時');
assert.ok(['S','A'].includes(weeklyRank(familyWeek.overall)),'25.5 小時在返鄉週應為高完成度');

// 10. 返鄉後差額平均到三週，且單週不暴增。
const deficitData=clone(familyData);deficitData.tasks.find(t=>t.id==='family-actual').actualMinutes=1140;
const catchup=catchUpPlan(deficitData,new Date('2026-09-14T12:00:00'));
assert.equal(catchup.active,true,'影片仍落後時需提出返鄉後補進度');assert.equal(catchup.weeks,3);assert.ok(catchup.weeklyAddition<=2.5,'差額不可一次塞回隔天');

// 11. 關閉返鄉模式後回到 Normal Week。
const normalAgain=clone(familySettings);normalAgain.familyVisit.enabled=false;
assert.equal(weekTypeFor(normalAgain,new Date('2026-09-11')),'normal');
assert.ok(generateDailySchedule('2026-09-12',normalAgain).filter(isLearningTask).reduce((s,t)=>s+t.plannedMinutes,0)>90,'關閉返鄉模式需回復一般週排程');

// 12. v2 舊 localStorage migration：保留完成狀態、EXP、設定與自訂任務。
const oldData=clone(seedData);oldData.tasks=[{id:'t2',date:'2026-09-08',subjectId:'finance',title:'舊財管影片',type:'video',plannedMinutes:180,actualMinutes:180,questionCount:0,exp:180,priority:'high',mainQuest:true,completed:true},{id:'custom-task',date:'2026-09-11',subjectId:'statistics',title:'自訂題目',type:'questions',plannedMinutes:75,actualMinutes:75,questionCount:42,exp:75,priority:'medium',mainQuest:true,completed:true}];oldData.settings={passPercent:77};oldData.player.exp=321;delete oldData.generatedScheduleDates;
const migrated=migrateData(oldData,2);
assert.equal(migrated.player.exp,321);assert.equal(migrated.settings.passPercent,77);assert.ok(migrated.tasks.some(t=>t.id==='custom-task'&&t.type==='practice'&&t.questionCount===42),'自訂任務與題數需保留並轉換類型');assert.ok(migrated.tasks.some(t=>t.completed&&t.subjectId==='finance'&&t.type==='video'),'舊完成狀態需映射到新排程');
assert.equal(migrated.settings.schedule.some(c=>c.title==='聽我台灣的聲音'),true,'migration 應更新正式課表');
assert.equal(migrated.settings.normalWeeklyStudyHours,34.5,'migration 應補入新週目標');assert.equal(migrated.generatedScheduleDates.length,7,'migration 應補入排程追蹤欄位');

const complete=clone(seedData);const financeVideo=complete.tasks.find(t=>t.subjectId==='finance'&&t.type==='video');financeVideo.completed=true;const finance=complete.subjects.find(s=>s.id==='finance');assert.equal(subjectTotals(complete,finance).completedOriginalHours,financeVideo.actualMinutes/60*finance.speed,'倍速影片換算應正確');
const backup=serializeData(complete);const restored=parseStoredJson(backup);assert.equal(JSON.parse(backup).schemaVersion,CURRENT_SCHEMA_VERSION);assert.equal(restored.tasks.find(t=>t.id===financeVideo.id).completed,true);
const familyStreakData=clone(seedData);familyStreakData.settings=familySettings;familyStreakData.tasks=familySaturday.map(t=>({...t,completed:isLearningTask(t)}));assert.equal(studyStreak(familyStreakData,new Date('2026-09-12T12:00:00')),1,'返鄉日完成最低學習即可維持 Streak');
assert.ok(backlogFor(seedData,seedData.subjects[0],new Date('2026-10-08')).behind>0);assert.deepEqual(weekRange(new Date('2026-09-13')),{start:'2026-09-07',end:'2026-09-13'});assert.equal(daysUntil('2026-12-25',new Date('2027-01-01')),0);assert.equal(clamp(Number.NaN),0);
assert.ok(seedData.settings.schedule.some(c=>c.weekday===5&&c.title==='聽我台灣的聲音'),'新正式課表需包含星期五課程');
assert.ok(familyFriday.filter(t=>t.type==='commute'||t.type==='family').every(t=>t.exp===0),'Commute 與 Family 不計 EXP');

console.log('All Grad Quest scheduling, migration, and persistence invariants passed.');
