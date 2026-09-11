'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { studyRepository } from '@/lib/study-storage';
import { completedExp, weekRange } from '@/lib/study-calculations';
import { generateDailySchedule } from '@/lib/study-schedule';
import type { AppData, AppSettings, Subject, Task } from '@/lib/study-types';

function rebuildDates(current:AppData,settings:AppSettings,dates:string[]){
  const oldTemplates=current.tasks.filter(t=>t.source==='template'&&dates.includes(t.date));
  const preserved=current.tasks.filter(t=>t.source!=='template'||!dates.includes(t.date));
  const rebuilt=dates.flatMap(date=>generateDailySchedule(date,settings).map(task=>{const old=oldTemplates.find(item=>item.date===date&&item.title===task.title&&item.type===task.type);return old?{...task,completed:old.completed,actualMinutes:old.actualMinutes,questionCount:old.questionCount}:task}));
  return {...current,settings,tasks:[...preserved,...rebuilt]};
}
const currentWeekDates=()=>{const start=weekRange(new Date()).start;return Array.from({length:7},(_,i)=>format(addDays(parseISO(start),i),'yyyy-MM-dd'))};

export function useStudyApp(){
  const [data,setData]=useState<AppData|null>(null);
  useEffect(()=>{
    const loaded=studyRepository.load();const start=weekRange(new Date()).start;
    for(let i=0;i<7;i++){
      const date=format(addDays(parseISO(start),i),'yyyy-MM-dd');
      if(!loaded.generatedScheduleDates.includes(date)){
        loaded.tasks.push(...generateDailySchedule(date,loaded.settings));loaded.generatedScheduleDates.push(date);
      }
    }
    setData(loaded);
  },[]);
  useEffect(()=>{if(data)studyRepository.save(data)},[data]);
  const update=useCallback((recipe:(current:AppData)=>AppData)=>setData(current=>current?recipe(current):current),[]);
  const toggleTask=useCallback((id:string)=>update(current=>({...current,tasks:current.tasks.map(t=>t.id===id?{...t,completed:!t.completed}:t)})),[update]);
  const deleteTask=useCallback((id:string)=>update(current=>({...current,tasks:current.tasks.filter(t=>t.id!==id)})),[update]);
  const saveTask=useCallback((task:Task)=>update(current=>({...current,tasks:current.tasks.some(t=>t.id===task.id)?current.tasks.map(t=>t.id===task.id?task:t):[...current.tasks,{...task,source:'custom'}]})),[update]);
  const updateSettings=useCallback((settings:AppSettings)=>update(current=>rebuildDates(current,settings,currentWeekDates().filter(date=>current.generatedScheduleDates.includes(date)))),[update]);
  const rescheduleDay=useCallback((date:string,wakeTime:string)=>update(current=>{const settings={...current.settings,wakeOverrides:{...current.settings.wakeOverrides,[date]:wakeTime}};return rebuildDates(current,settings,[date])}),[update]);
  const updateSubject=useCallback((subject:Subject)=>update(current=>({...current,subjects:current.subjects.map(s=>s.id===subject.id?subject:s)})),[update]);
  const settleWeek=useCallback((weekStart:string,rating:string)=>update(current=>current.settledWeeks.includes(weekStart)?current:{...current,settledWeeks:[...current.settledWeeks,weekStart],player:{...current.player,exp:current.player.exp+(rating==='S'?500:rating==='A'?350:rating==='B'?220:120),coins:current.player.coins+100}}),[update]);
  const exportData=useCallback(()=>data?studyRepository.exportJson(data):'', [data]);
  const importData=useCallback((raw:string)=>setData(studyRepository.importJson(raw)),[]);
  const clearData=useCallback(()=>setData(studyRepository.clear()),[]);
  const totalExp=useMemo(()=>data?data.player.exp+completedExp(data.tasks,data.settings.expMultiplier):0,[data]);
  return {data,totalExp,toggleTask,deleteTask,saveTask,updateSettings,rescheduleDay,updateSubject,settleWeek,exportData,importData,clearData};
}
