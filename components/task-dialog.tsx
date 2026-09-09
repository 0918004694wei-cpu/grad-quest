'use client';
import { useEffect, useState } from 'react';
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from '@/components/ui/dialog';
import type { Subject, Task, TaskType } from '@/lib/study-types';

export function TaskDialog({open,onOpenChange,task,date,subjects,onSave}:{open:boolean;onOpenChange:(v:boolean)=>void;task:Task|null;date:string;subjects:Subject[];onSave:(task:Task)=>void}){
  const blank:Task={id:'',date,subjectId:'economics',title:'',type:'video',plannedMinutes:60,actualMinutes:60,questionCount:0,exp:60,priority:'medium',mainQuest:true,completed:false};
  const [draft,setDraft]=useState<Task>(blank);
  useEffect(()=>{if(open)setDraft(task?{...task}:{...blank,id:crypto.randomUUID()})},[open,task,date]);
  const patch=<K extends keyof Task>(key:K,value:Task[K])=>setDraft(d=>({...d,[key]:value}));
  const commit=()=>{if(!draft.title.trim())return;onSave({...draft,title:draft.title.trim()});onOpenChange(false)};
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="task-modal"><DialogHeader><DialogTitle>{task?'編輯任務':'建立新任務'}</DialogTitle><DialogDescription>安排在課表空檔內；完成後會同步更新 EXP、科目與每週進度。</DialogDescription></DialogHeader>
    <form onSubmit={event=>{event.preventDefault();commit()}}>
    <div className="form-grid"><label className="wide">任務名稱<input value={draft.title} onChange={e=>patch('title',e.target.value)} placeholder="例如：財管資本預算影片"/></label><label>日期<input type="date" value={draft.date} onChange={e=>patch('date',e.target.value)}/></label><label>科目<select value={draft.subjectId||''} onChange={e=>patch('subjectId',(e.target.value||undefined) as Task['subjectId'])}><option value="">無</option>{subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label>類型<select value={draft.type} onChange={e=>patch('type',e.target.value as TaskType)}><option value="video">影片</option><option value="review">複習</option><option value="questions">題目</option><option value="english">英文</option><option value="school">學校</option><option value="rest">休息</option></select></label><label>預計分鐘<input type="number" min="0" value={draft.plannedMinutes} onChange={e=>patch('plannedMinutes',Math.max(0,+e.target.value))}/></label><label>實際分鐘<input type="number" min="0" value={draft.actualMinutes} onChange={e=>patch('actualMinutes',Math.max(0,+e.target.value))}/></label><label>題目數<input type="number" min="0" value={draft.questionCount} onChange={e=>patch('questionCount',Math.max(0,+e.target.value))}/></label><label>EXP<input type="number" min="0" value={draft.exp} onChange={e=>patch('exp',Math.max(0,+e.target.value))}/></label><label>優先級<select value={draft.priority} onChange={e=>patch('priority',e.target.value as Task['priority'])}><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label><label className="switch-line"><input type="checkbox" checked={draft.mainQuest} onChange={e=>patch('mainQuest',e.target.checked)}/> Main Quest 核心任務</label></div>
    <DialogFooter><button type="button" className="secondary" onClick={()=>onOpenChange(false)}>取消</button><button type="button" className="primary" disabled={!draft.title.trim()} onPointerDown={event=>{event.preventDefault();commit()}}>儲存任務</button></DialogFooter></form>
  </DialogContent></Dialog>;
}
