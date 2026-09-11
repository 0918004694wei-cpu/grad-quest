import { addDays, differenceInCalendarDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import type { AppData, Subject, SubjectId, Task } from './study-types';
import { isFamilyVisitDate, isLearningTask, weekTypeFor } from './study-schedule.ts';

export const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0));
export const daysUntil=(date:string,now=new Date())=>Math.max(0,differenceInCalendarDays(parseISO(date),now));
export const levelFromExp=(exp:number)=>Math.floor(Math.sqrt(Math.max(0,exp)/100))+1;
export const levelProgress=(exp:number)=>{const level=levelFromExp(exp);const floor=(level-1)**2*100;const ceil=level**2*100;return {level,current:exp-floor,needed:ceil-floor,percent:clamp((exp-floor)/(ceil-floor)*100)}};
export const getDateKey=(date=new Date())=>format(date,'yyyy-MM-dd');
export const weekRange=(date=new Date())=>({start:getDateKey(startOfWeek(date,{weekStartsOn:1})),end:getDateKey(endOfWeek(date,{weekStartsOn:1}))});
export const tasksForDate=(tasks:Task[],date:string)=>tasks.filter(t=>t.date===date);
export const completedExp=(tasks:Task[],multiplier=1)=>Math.round(tasks.filter(t=>t.completed&&isLearningTask(t)).reduce((s,t)=>s+t.exp,0)*multiplier);
export const dailyRating=(tasks:Task[],passPercent:number,context?:{settings:AppData['settings'];date:string})=>{
  const learning=tasks.filter(isLearningTask);
  if(context&&isFamilyVisitDate(context.settings,context.date)){
    const minutes=learning.filter(t=>t.completed).reduce((sum,t)=>sum+t.actualMinutes,0);const rate=clamp(minutes/context.settings.familyLearningMinimumMinutes*100);
    return {rate,rating:(rate>=100?'Pass':'未通關') as '未通關'|'Pass'|'Great'|'Perfect'};
  }
  const core=learning.filter(t=>t.mainQuest);const threshold=context?.settings.wakeOverrides[context.date]?Math.min(passPercent,50):passPercent;
  const rate=core.length?core.filter(t=>t.completed).length/core.length*100:learning.length?0:100;
  const rating:'未通關'|'Pass'|'Great'|'Perfect'=rate>=100?'Perfect':rate>=90?'Great':rate>=threshold?'Pass':'未通關';return {rate:clamp(rate),rating};
};
export function studyStreak(data:AppData,now=new Date()){
  let streak=0;
  const todayKey=getDateKey(now);
  const todayTasks=tasksForDate(data.tasks,todayKey);
  let cursor=todayTasks.length&&dailyRating(todayTasks,data.settings.passPercent,{settings:data.settings,date:todayKey}).rating!=='未通關'?now:addDays(now,-1);
  for(let checked=0;checked<366;checked++){
    const date=getDateKey(cursor);const dayTasks=tasksForDate(data.tasks,date);
    if(!dayTasks.length||dailyRating(dayTasks,data.settings.passPercent,{settings:data.settings,date}).rating==='未通關')break;
    streak++;cursor=addDays(cursor,-1);
  }
  return streak;
}
export function subjectTotals(data:AppData,subject:Subject){const done=data.tasks.filter(t=>t.completed&&t.subjectId===subject.id);const videoActual=done.filter(t=>t.type==='video').reduce((s,t)=>s+t.actualMinutes/60,0);const originalAdded=videoActual*subject.speed;const reviewAdded=done.filter(t=>t.type==='review'||t.type==='weekly-review').reduce((s,t)=>s+t.actualMinutes/60,0);const questionsAdded=done.filter(t=>t.type==='practice').reduce((s,t)=>s+t.questionCount,0);return {...subject,completedOriginalHours:clamp(subject.completedOriginalHours+originalAdded,0,subject.originalVideoHours||9999),reviewHours:subject.reviewHours+reviewAdded,questions:subject.questions+questionsAdded,exp:subject.exp+completedExp(done,data.settings.expMultiplier)};}
export function backlogFor(data:AppData,subject:Subject,now=new Date()){if(subject.id==='english'||!subject.originalVideoHours)return null;const totalDays=Math.max(1,differenceInCalendarDays(parseISO(data.settings.videoDeadline),parseISO(data.settings.startDate)));const elapsed=clamp(differenceInCalendarDays(now,parseISO(data.settings.startDate)),0,totalDays);const expected=subject.originalVideoHours*(elapsed/totalDays);const current=subjectTotals(data,subject).completedOriginalHours;const behind=Math.max(0,expected-current);const ahead=Math.max(0,current-expected);const weeks=Math.max(1,daysUntil(data.settings.videoDeadline,now)/7);return {expected,current,behind,ahead,extraPerWeek:behind/weeks,percent:clamp(current/subject.originalVideoHours*100),forecastDays:current>0?Math.ceil((subject.originalVideoHours-current)/(current/Math.max(1,elapsed))):null};}
export function weeklyTarget(data:AppData,now=new Date()){
  const type=weekTypeFor(data.settings,now);const {start}=weekRange(now);
  if(type==='recovery')return {type,targetStudyHours:data.settings.normalWeeklyStudyHours*.7,targetEnglishHours:data.settings.englishWeeklyHours*.7};
  if(type==='normal')return {type,targetStudyHours:data.settings.normalWeeklyStudyHours,targetEnglishHours:data.settings.englishWeeklyHours};
  const weights:Record<number,number>={0:3,1:0,2:0,3:0,4:.5,5:2,6:4};
  const reduction=Array.from({length:7},(_,i)=>addDays(parseISO(start),i)).filter(day=>isFamilyVisitDate(data.settings,getDateKey(day),now)).reduce((sum,day)=>sum+(weights[day.getDay()]||0),0);
  const familyDays=Array.from({length:7},(_,i)=>addDays(parseISO(start),i)).filter(day=>[0,4,5,6].includes(day.getDay())&&isFamilyVisitDate(data.settings,getDateKey(day),now)).length;
  return {type,targetStudyHours:Math.max(data.settings.normalWeeklyStudyHours*.65,data.settings.normalWeeklyStudyHours-reduction),targetEnglishHours:Math.max(.75,data.settings.englishWeeklyHours-familyDays*.35)};
}
export function weeklyStats(data:AppData,now=new Date()){
  const {start,end}=weekRange(now);const tasks=data.tasks.filter(t=>t.date>=start&&t.date<=end);const completed=tasks.filter(t=>t.completed&&isLearningTask(t));
  const video=(id:SubjectId)=>completed.filter(t=>t.subjectId===id&&t.type==='video').reduce((s,t)=>s+t.actualMinutes/60,0);
  const rq=completed.filter(t=>t.type==='review'||t.type==='practice'||t.type==='weekly-review').reduce((s,t)=>s+t.actualMinutes/60,0);
  const english=completed.filter(t=>t.type==='english'||t.subjectId==='english').reduce((s,t)=>s+t.actualMinutes/60,0);
  const graduateHours=completed.filter(t=>t.type!=='english'&&t.subjectId!=='english').reduce((s,t)=>s+t.actualMinutes/60,0);const target=weeklyTarget(data,now);
  const overall=clamp((graduateHours+english)/(target.targetStudyHours+target.targetEnglishHours)*100);
  return {start,end,tasks,economics:video('economics'),finance:video('finance'),statistics:video('statistics'),reviewQuestions:rq,english,graduateHours,overall,...target};
}
export const weeklyRank=(rate:number)=>rate>=95?'S':rate>=85?'A':rate>=70?'B':'C';
export function catchUpPlan(data:AppData,now=new Date()){
  const end=data.settings.familyVisit.endDate;if(!end)return {active:false,deficit:0,weeks:0,weeklyAddition:0};const since=differenceInCalendarDays(now,parseISO(end));
  if(since<=0||since>21)return {active:false,deficit:0,weeks:0,weeklyAddition:0};
  const historicalData={...data,settings:{...data.settings,familyVisit:{...data.settings.familyVisit,enabled:true}}};
  const familyStats=weeklyStats(historicalData,parseISO(end));const deficit=Math.max(0,familyStats.targetStudyHours-familyStats.graduateHours);
  const needsCatchUp=data.subjects.filter(s=>s.originalVideoHours).some(s=>(backlogFor(data,s,now)?.behind||0)>1);
  if(!needsCatchUp||deficit<.5)return {active:false,deficit,weeks:0,weeklyAddition:0};const weeks=3;
  return {active:true,deficit,weeks,weeklyAddition:Math.min(2.5,deficit/weeks)};
}
export function currentStage(now=new Date()){const key=getDateKey(now);if(key<='2026-10-04')return {n:1,name:'基礎建設期',mix:'影片 70%・題目 20%・整理 10%'};if(key<='2026-11-01')return {n:2,name:'能力擴張期',mix:'影片 60%・題目 30%・複習 10%'};if(key<='2026-12-06')return {n:3,name:'攻堅整合期',mix:'影片 50%・題目 40%・整理 10%'};return {n:4,name:'最終攻略期',mix:'題目 70%・弱點複習 20%・整理 10%'};}
