import { addDays, differenceInCalendarDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import type { AppData, Subject, SubjectId, Task } from './study-types';

export const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0));
export const daysUntil=(date:string,now=new Date())=>Math.max(0,differenceInCalendarDays(parseISO(date),now));
export const levelFromExp=(exp:number)=>Math.floor(Math.sqrt(Math.max(0,exp)/100))+1;
export const levelProgress=(exp:number)=>{const level=levelFromExp(exp);const floor=(level-1)**2*100;const ceil=level**2*100;return {level,current:exp-floor,needed:ceil-floor,percent:clamp((exp-floor)/(ceil-floor)*100)}};
export const getDateKey=(date=new Date())=>format(date,'yyyy-MM-dd');
export const weekRange=(date=new Date())=>({start:getDateKey(startOfWeek(date,{weekStartsOn:1})),end:getDateKey(endOfWeek(date,{weekStartsOn:1}))});
export const tasksForDate=(tasks:Task[],date:string)=>tasks.filter(t=>t.date===date);
export const completedExp=(tasks:Task[],multiplier=1)=>Math.round(tasks.filter(t=>t.completed).reduce((s,t)=>s+t.exp,0)*multiplier);
export const dailyRating=(tasks:Task[],passPercent:number)=>{const core=tasks.filter(t=>t.mainQuest);const rate=core.length?core.filter(t=>t.completed).length/core.length*100:100;const rating:'未通關'|'Pass'|'Great'|'Perfect'=rate>=100?'Perfect':rate>=90?'Great':rate>=passPercent?'Pass':'未通關';return {rate:clamp(rate),rating};};
export function studyStreak(tasks:Task[],passPercent:number,now=new Date()){
  let streak=0;
  const todayKey=getDateKey(now);
  const todayTasks=tasksForDate(tasks,todayKey);
  let cursor=todayTasks.length&&dailyRating(todayTasks,passPercent).rating!=='未通關'?now:addDays(now,-1);
  for(let checked=0;checked<366;checked++){
    const dayTasks=tasksForDate(tasks,getDateKey(cursor));
    if(!dayTasks.length||dailyRating(dayTasks,passPercent).rating==='未通關')break;
    streak++;cursor=addDays(cursor,-1);
  }
  return streak;
}
export function subjectTotals(data:AppData,subject:Subject){const done=data.tasks.filter(t=>t.completed&&t.subjectId===subject.id);const videoActual=done.filter(t=>t.type==='video').reduce((s,t)=>s+t.actualMinutes/60,0);const originalAdded=videoActual*subject.speed;const reviewAdded=done.filter(t=>t.type==='review').reduce((s,t)=>s+t.actualMinutes/60,0);const questionsAdded=done.filter(t=>t.type==='questions').reduce((s,t)=>s+t.questionCount,0);return {...subject,completedOriginalHours:clamp(subject.completedOriginalHours+originalAdded,0,subject.originalVideoHours||9999),reviewHours:subject.reviewHours+reviewAdded,questions:subject.questions+questionsAdded,exp:subject.exp+completedExp(done,data.settings.expMultiplier)};}
export function backlogFor(data:AppData,subject:Subject,now=new Date()){if(subject.id==='english'||!subject.originalVideoHours)return null;const totalDays=Math.max(1,differenceInCalendarDays(parseISO(data.settings.videoDeadline),parseISO(data.settings.startDate)));const elapsed=clamp(differenceInCalendarDays(now,parseISO(data.settings.startDate)),0,totalDays);const expected=subject.originalVideoHours*(elapsed/totalDays);const current=subjectTotals(data,subject).completedOriginalHours;const behind=Math.max(0,expected-current);const ahead=Math.max(0,current-expected);const weeks=Math.max(1,daysUntil(data.settings.videoDeadline,now)/7);return {expected,current,behind,ahead,extraPerWeek:behind/weeks,percent:clamp(current/subject.originalVideoHours*100),forecastDays:current>0?Math.ceil((subject.originalVideoHours-current)/(current/Math.max(1,elapsed))):null};}
export function weeklyStats(data:AppData,now=new Date()){const {start,end}=weekRange(now);const tasks=data.tasks.filter(t=>t.date>=start&&t.date<=end);const completed=tasks.filter(t=>t.completed);const video=(id:SubjectId)=>completed.filter(t=>t.subjectId===id&&t.type==='video').reduce((s,t)=>s+t.actualMinutes/60,0);const rq=completed.filter(t=>t.type==='review'||t.type==='questions').reduce((s,t)=>s+t.actualMinutes/60,0);const english=completed.filter(t=>t.subjectId==='english').reduce((s,t)=>s+t.actualMinutes/60,0);const targetVideo=24;const targetRQ=13.5;const overall=clamp((video('economics')+video('finance')+video('statistics')+rq+english)/(targetVideo+targetRQ+data.settings.weeklyTargets.english)*100);return {start,end,tasks,economics:video('economics'),finance:video('finance'),statistics:video('statistics'),reviewQuestions:rq,english,overall};}
export function currentStage(now=new Date()){const key=getDateKey(now);if(key<='2026-10-04')return {n:1,name:'基礎建設期',mix:'影片 70%・題目 20%・整理 10%'};if(key<='2026-11-01')return {n:2,name:'能力擴張期',mix:'影片 60%・題目 30%・複習 10%'};if(key<='2026-12-06')return {n:3,name:'攻堅整合期',mix:'影片 50%・題目 40%・整理 10%'};return {n:4,name:'最終攻略期',mix:'題目 70%・弱點複習 20%・整理 10%'};}
