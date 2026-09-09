'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { studyRepository } from '@/lib/study-storage';
import { completedExp } from '@/lib/study-calculations';
import type { AppData, AppSettings, Subject, Task } from '@/lib/study-types';

export function useStudyApp(){
  const [data,setData]=useState<AppData|null>(null);
  useEffect(()=>setData(studyRepository.load()),[]);
  useEffect(()=>{if(data)studyRepository.save(data)},[data]);
  const update=useCallback((recipe:(current:AppData)=>AppData)=>setData(current=>current?recipe(current):current),[]);
  const toggleTask=useCallback((id:string)=>update(current=>({...current,tasks:current.tasks.map(t=>t.id===id?{...t,completed:!t.completed}:t)})),[update]);
  const deleteTask=useCallback((id:string)=>update(current=>({...current,tasks:current.tasks.filter(t=>t.id!==id)})),[update]);
  const saveTask=useCallback((task:Task)=>update(current=>({...current,tasks:current.tasks.some(t=>t.id===task.id)?current.tasks.map(t=>t.id===task.id?task:t):[...current.tasks,task]})),[update]);
  const updateSettings=useCallback((settings:AppSettings)=>update(current=>({...current,settings})),[update]);
  const updateSubject=useCallback((subject:Subject)=>update(current=>({...current,subjects:current.subjects.map(s=>s.id===subject.id?subject:s)})),[update]);
  const settleWeek=useCallback((weekStart:string,rating:string)=>update(current=>current.settledWeeks.includes(weekStart)?current:{...current,settledWeeks:[...current.settledWeeks,weekStart],player:{...current.player,exp:current.player.exp+(rating==='S'?500:rating==='A'?350:rating==='B'?220:120),coins:current.player.coins+100}}),[update]);
  const exportData=useCallback(()=>data?studyRepository.exportJson(data):'', [data]);
  const importData=useCallback((raw:string)=>setData(studyRepository.importJson(raw)),[]);
  const clearData=useCallback(()=>setData(studyRepository.clear()),[]);
  const totalExp=useMemo(()=>data?data.player.exp+completedExp(data.tasks,data.settings.expMultiplier):0,[data]);
  return {data,totalExp,toggleTask,deleteTask,saveTask,updateSettings,updateSubject,settleWeek,exportData,importData,clearData};
}
