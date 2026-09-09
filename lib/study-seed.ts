import type { AppData, Task } from './study-types';

const task = (id:string,date:string,subjectId:Task['subjectId'],title:string,type:Task['type'],minutes:number,exp:number,mainQuest=true,start?:string,end?:string):Task => ({ id,date,subjectId,title,type,plannedMinutes:minutes,actualMinutes:minutes,questionCount:type==='questions'?20:0,exp,priority:mainQuest?'high':'medium',mainQuest,completed:false,scheduledStart:start,scheduledEnd:end });

export const seedData: AppData = {
  subjects: [
    {id:'economics',name:'經濟學',shortName:'經濟',color:'#7fa8df',originalVideoHours:200,completedOriginalHours:0,speed:1.25,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
    {id:'finance',name:'財務管理',shortName:'財管',color:'#d8b978',originalVideoHours:100,completedOriginalHours:0,speed:1.25,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
    {id:'statistics',name:'統計學',shortName:'統計',color:'#75c7aa',originalVideoHours:100,completedOriginalHours:0,speed:1.25,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
    {id:'english',name:'英文',shortName:'英文',color:'#ae91d7',originalVideoHours:0,completedOriginalHours:0,speed:1,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
  ],
  tasks: [
    task('t1','2026-09-08','english','英文閱讀／單字','english',90,45,false,'08:00','09:30'),
    task('t2','2026-09-08','finance','財管課程影片','video',180,180,true,'13:30','16:30'),
    task('t3','2026-09-08','finance','財管題目 20 題','questions',90,100,true,'17:00','18:30'),
    task('t4','2026-09-08',undefined,'19:00 後自由時間','rest',60,20,false,'19:00'),
    task('w1','2026-09-09','statistics','統計課程影片','video',180,180,true,'08:30','11:30'),
    task('w2','2026-09-09','statistics','統計題目與複習','questions',120,120,true,'15:30','17:30'),
    task('w3','2026-09-09','english','英文輕任務','english',30,20,false,'20:30','21:00'),
    task('h1','2026-09-10','economics','經濟課程影片','video',150,150,true,'08:00','10:30'),
    task('h2','2026-09-10','economics','經濟題目','questions',90,100,true,'13:30','15:00'),
    task('h3','2026-09-10','english','英文閱讀','english',60,35,false,'19:30','20:30'),
    task('f1','2026-09-11','economics','經濟課程影片','video',210,210,true,'09:00','12:30'),
    task('f2','2026-09-11','finance','財管課程影片','video',120,120,true,'14:00','16:00'),
    task('f3','2026-09-11','finance','跨章題目訓練','questions',150,140,true,'16:30','19:00'),
    task('f4','2026-09-11',undefined,'19:00 後 Recovery','rest',60,20,false,'19:00'),
    task('s1','2026-09-12','statistics','統計課程影片','video',120,120,true,'09:30','11:30'),
    task('s2','2026-09-12','economics','經濟課程影片','video',180,180,true,'13:00','16:00'),
    task('s3','2026-09-12','economics','題目與錯題整理','questions',150,140,true,'16:30','19:00'),
    task('u1','2026-09-13','finance','財管課程影片','video',120,120,true,'09:30','11:30'),
    task('u2','2026-09-13','statistics','統計課程影片','video',60,60,true,'13:00','14:00'),
    task('u3','2026-09-13','statistics','本週三科總複習','review',120,110,true,'14:00','16:00'),
    task('u4','2026-09-13','english','英文週任務','english',90,45,false,'16:00','17:30'),
  ],
  sessions: [], settledWeeks: [], player:{name:'備考冒險者',exp:0,coins:0,streak:0},
  milestones:[
    {id:'m1',date:'2026-09-30',title:'第一補給站',targetPercent:18,description:'三科影片完成約 15–20%'},
    {id:'m2',date:'2026-10-31',title:'中段據點',targetPercent:48,description:'三科影片完成約 45–50%'},
    {id:'m3',date:'2026-11-30',title:'最終整備',targetPercent:83,description:'三科影片完成約 80–85%'},
    {id:'m4',date:'2026-12-12',title:'影片全破',targetPercent:100,description:'三科補習班影片完成'},
    {id:'m5',date:'2026-12-25',title:'第一輪完整',targetPercent:100,description:'影片＋複習＋題目完成第一輪'},
  ],
  settings:{startDate:'2026-09-08',phaseDeadline:'2026-12-25',videoDeadline:'2026-12-12',examDate:'2027-02-11',passPercent:70,expMultiplier:1,maxDailyHours:7.5,weeklyTargets:{economics:17,finance:9,statistics:9.5,english:3.5},restWindows:['星期五 19:00 後','星期六 19:00 後','星期日 17:30 後'],schedule:[
    {id:'c1',weekday:1,title:'最優化理論',start:'09:00',end:'12:00'},{id:'c2',weekday:1,title:'有趣的粒子物理簡介',start:'19:30',end:'21:20'},
    {id:'c3',weekday:2,title:'數統導論',start:'10:10',end:'12:00'},{id:'c4',weekday:3,title:'計量經濟學一',start:'12:10',end:'15:10'},
    {id:'c5',weekday:3,title:'創新領導專題',start:'18:30',end:'20:20'},{id:'c6',weekday:4,title:'數統導論',start:'11:10',end:'12:00'},{id:'c7',weekday:4,title:'健走與慢跑',start:'15:30',end:'17:20'}
  ]}
};
