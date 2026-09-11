import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import type { AppSettings, SubjectId, Task, TaskType, WeekType } from './study-types';

type TemplateTask = Omit<Task, 'id' | 'date' | 'completed' | 'source'>;
const learningTypes = new Set<TaskType>(['video','practice','review','english','weekly-review']);
const minutesBetween=(start:string,end:string)=>{const [sh,sm]=start.split(':').map(Number);const [eh,em]=end.split(':').map(Number);return Math.max(0,eh*60+em-sh*60-sm)};
const atMinutes=(value:string)=>{const [h,m]=value.split(':').map(Number);return h*60+m};
const atTime=(minutes:number)=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
const block=(title:string,type:TaskType,start:string,end:string,subjectId?:SubjectId,mainQuest=false,priority:Task['priority']='medium',questionCount=0):TemplateTask=>({title,type,subjectId,plannedMinutes:minutesBetween(start,end),actualMinutes:minutesBetween(start,end),questionCount,exp:learningTypes.has(type)?Math.round(minutesBetween(start,end)*(type==='english'?.6:1)):0,priority,mainQuest,scheduledStart:start,scheduledEnd:end});
const wake=(start:string,end='10:00')=>block('起床與晨間準備','recovery',start,end,undefined,false,'low');
const lunch=()=>block('買午餐＋午餐＋午休','recovery','12:00','14:00',undefined,false,'low');
const dinner=(start:string,end:string)=>block('晚餐／生活緩衝','recovery',start,end,undefined,false,'low');
const rest=(start:string,end:string)=>block('休息與恢復','recovery',start,end,undefined,false,'low');

function normalTemplate(weekday:number,settings:AppSettings):TemplateTask[]{
  switch(weekday){
    case 1:return [wake(settings.mondayWakeTime,'08:30'),block('最優化理論','school','09:00','12:00'),lunch(),block('經濟影片','video','14:00','16:30','economics',true,'high'),rest('16:30','17:00'),block('經濟複習／題目','practice','17:00','18:15','economics',true,'high',20),dinner('18:15','19:15'),block('有趣的粒子物理簡介','school','19:30','21:20'),block('自由時間','recovery','21:30','22:30',undefined,false,'low')];
    case 2:return [wake(settings.defaultWakeTime),block('數統導論','school','10:10','12:00'),lunch(),block('財管影片','video','14:00','17:00','finance',true,'high'),rest('17:00','17:30'),block('財管題目','practice','17:30','19:00','finance',true,'high',20),dinner('19:00','20:00'),block('英文閱讀／單字','english','20:00','20:45','english',false,'low')];
    case 3:return [wake(settings.defaultWakeTime),block('統計影片','video','10:00','12:00','statistics',true,'high'),lunch(),block('經濟影片','video','14:00','16:30','economics',true,'high'),rest('16:30','17:00'),block('統計題目／複習','practice','17:00','19:00','statistics',true,'high',25),dinner('19:00','20:00'),block('經濟題目','practice','20:00','21:30','economics',false,'medium',20)];
    case 4:return [wake(settings.defaultWakeTime),block('經濟影片','video','10:00','10:50','economics',true,'high'),block('數統導論','school','11:10','12:00'),lunch(),block('經濟題目／複習','practice','14:00','15:00','economics',true,'high',15),block('健走與慢跑','school','15:30','17:20'),block('洗澡＋晚餐','recovery','17:30','18:30'),block('英文','english','19:00','20:00','english',false,'low'),block('自由時間','recovery','20:00','21:30',undefined,false,'low')];
    case 5:return [wake(settings.defaultWakeTime),block('財管影片','video','10:00','12:00','finance',true,'high'),lunch(),block('統計影片','video','14:00','16:00','statistics',true,'high'),block('聽我台灣的聲音','school','16:30','18:20'),block('晚間自由／不補進度','recovery','18:30','21:30',undefined,false,'low')];
    case 6:return [wake(settings.defaultWakeTime),block('經濟影片','video','10:00','12:00','economics',true,'high'),lunch(),block('統計影片','video','14:00','16:30','statistics',true,'high'),rest('16:30','17:00'),block('題目練習','practice','17:00','19:00','statistics',true,'high',25),block('晚間自由','recovery','19:00','21:30',undefined,false,'low')];
    default:return [wake(settings.defaultWakeTime),block('財管影片','video','10:00','12:00','finance',true,'high'),lunch(),block('經濟影片','video','14:00','16:00','economics',true,'high'),rest('16:00','16:30'),block('本週總複習','weekly-review','16:30','18:30','statistics',true,'medium'),dinner('18:30','19:30'),block('英文','english','19:30','20:15','english',false,'low'),block('自由時間','recovery','20:15','21:30',undefined,false,'low')];
  }
}

export function isFamilyVisitDate(settings:AppSettings,date:string,now=new Date()):boolean{
  if(!settings.familyVisit.enabled)return false;
  if(settings.familyVisit.startDate&&settings.familyVisit.endDate&&date>=settings.familyVisit.startDate&&date<=settings.familyVisit.endDate)return true;
  if(!settings.familyVisit.currentWeek)return false;
  const start=format(startOfWeek(now,{weekStartsOn:1}),'yyyy-MM-dd');const end=format(addDays(parseISO(start),6),'yyyy-MM-dd');
  return date>=start&&date<=end;
}

function familyTemplate(weekday:number,settings:AppSettings):TemplateTask[]{
  if(weekday===4)return [wake(settings.defaultWakeTime),block('經濟影片','video','10:00','10:50','economics',true,'medium'),block('數統導論','school','11:10','12:00'),lunch(),block('經濟筆記複習','review','14:00','15:00','economics',true,'medium'),block('健走與慢跑','school','15:30','17:20'),block('新竹 → 台中返鄉通勤','commute','17:30','19:00'),block('陪伴家人／恢復','family','19:00','22:00')];
  if(weekday===5)return [wake(settings.defaultWakeTime),block('財管補習班影片','video','10:00','12:00','finance',true,'medium'),lunch(),block('公式與筆記回顧','review','14:00','14:45','finance',false,'low'),block('台中 → 田中返鄉通勤','commute','15:00','16:00'),block('陪伴家人／恢復','family','16:00','21:30')];
  if(weekday===6)return [wake(settings.defaultWakeTime),block('最低維持：錯題二刷','review','10:30','11:15','statistics',true,'low'),lunch(),block('Family Visit Day','family','14:00','21:30')];
  if(weekday===0)return [wake(settings.defaultWakeTime),block('返鄉週簡短整理','weekly-review','10:30','11:30','economics',true,'low'),lunch(),block('陪伴家人／彈性返程','family','14:00','16:00'),block('田中 → 新竹返程','commute','16:00','18:00'),block('晚間恢復','recovery','18:00','21:30')];
  return normalTemplate(weekday,settings);
}

function addSchoolCommute(tasks:TemplateTask[],settings:AppSettings):TemplateTask[]{
  const firstSchool=tasks.filter(t=>t.type==='school'&&t.scheduledStart).sort((a,b)=>a.scheduledStart!.localeCompare(b.scheduledStart!))[0];
  if(!firstSchool)return tasks;
  const minutes=settings.rainyDayMode?settings.rainyCommuteMinutes:settings.normalCommuteMinutes;const end=firstSchool.scheduledStart!;const start=atTime(atMinutes(end)-minutes);
  const adjusted=tasks.map(task=>task.type==='video'&&task.scheduledEnd&&task.scheduledEnd>start&&task.scheduledStart!<start?{...task,scheduledEnd:start,plannedMinutes:minutesBetween(task.scheduledStart!,start),actualMinutes:minutesBetween(task.scheduledStart!,start),adjustment:settings.rainyDayMode?'雨天通勤優先，Side Quest 已縮短；午休與睡眠不變。':task.adjustment}:task);
  return [...adjusted,block(settings.rainyDayMode?'雨天通勤（已多預留 20 分鐘）':'通勤','commute',start,end)];
}

function applyLateWake(tasks:TemplateTask[],date:string,settings:AppSettings):TemplateTask[]{
  const override=settings.wakeOverrides[date];if(!override)return tasks;
  const baseline=parseISO(date).getDay()===1?settings.mondayWakeTime:settings.defaultWakeTime;const delay=Math.max(0,atMinutes(override)-atMinutes(baseline));if(delay<30)return tasks;
  const available=atTime(Math.min(atMinutes(override)+30,12*60));
  return tasks.flatMap(task=>{if(!learningTypes.has(task.type)||!task.scheduledStart||task.scheduledStart>=available)return [task];if(!task.mainQuest)return [];return [{...task,scheduledStart:undefined,scheduledEnd:undefined,adjustment:`${override} 晚起：保留 Main Quest，改為今日 21:30 前的彈性任務；不補到深夜。`}];});
}

export function generateDailySchedule(date:string,settings:AppSettings):Task[]{
  const weekday=parseISO(date).getDay();const raw=isFamilyVisitDate(settings,date)?familyTemplate(weekday,settings):normalTemplate(weekday,settings);
  return applyLateWake(addSchoolCommute(raw,settings),date,settings).sort((a,b)=>(a.scheduledStart||'23:59').localeCompare(b.scheduledStart||'23:59')).map((item,index)=>({...item,id:`template-${date}-${index}-${item.type}`,date,completed:false,source:'template'}));
}
export function generateWeekSchedule(weekStart:string,settings:AppSettings):Task[]{return Array.from({length:7},(_,i)=>generateDailySchedule(format(addDays(parseISO(weekStart),i),'yyyy-MM-dd'),settings)).flat()}
export function weekTypeFor(settings:AppSettings,date=new Date()):WeekType{
  if(settings.weekTypeOverride==='recovery')return 'recovery';if(settings.weekTypeOverride==='normal')return 'normal';const start=format(startOfWeek(date,{weekStartsOn:1}),'yyyy-MM-dd');
  return Array.from({length:7},(_,i)=>format(addDays(parseISO(start),i),'yyyy-MM-dd')).some(day=>isFamilyVisitDate(settings,day,date))?'family':'normal';
}
export function familyVisitPhase(settings:AppSettings,date:string):string{if(!isFamilyVisitDate(settings,date))return '';const day=parseISO(date).getDay();if(day===4)return '新竹 → 台中';if(day===5)return '台中 → 田中';if(day===6)return '田中・陪伴家人';if(day===0)return '田中 → 新竹';return '返鄉週・彈性安排'}
export const isLearningTask=(task:Task)=>learningTypes.has(task.type);
