import { generateWeekSchedule } from './study-schedule.ts';
import type { AppData, AppSettings } from './study-types';

export const defaultSettings:AppSettings={
  startDate:'2026-09-08',phaseDeadline:'2026-12-25',videoDeadline:'2026-12-12',examDate:'2027-02-11',passPercent:70,expMultiplier:1,maxDailyHours:7,
  weeklyTargets:{economics:13,finance:9,statistics:12.5,english:2.75},
  restWindows:['每日 12:00–14:00 午餐＋午休','星期五 18:30 後不補進度','星期六 19:00 後','星期日 20:15 後'],
  schedule:[
    {id:'c1',weekday:1,title:'最優化理論',start:'09:00',end:'12:00',type:'school'},{id:'c2',weekday:1,title:'有趣的粒子物理簡介',start:'19:30',end:'21:20',type:'school'},
    {id:'c3',weekday:2,title:'數統導論',start:'10:10',end:'12:00',type:'school'},{id:'c4',weekday:4,title:'數統導論',start:'11:10',end:'12:00',type:'school'},
    {id:'c5',weekday:4,title:'健走與慢跑',start:'15:30',end:'17:20',type:'school'},{id:'c6',weekday:5,title:'聽我台灣的聲音',start:'16:30',end:'18:20',type:'school'},
  ],
  defaultWakeTime:'09:30',mondayWakeTime:'08:00',lunchStart:'12:00',lunchEnd:'14:00',normalCommuteMinutes:10,rainyCommuteMinutes:30,rainyDayMode:false,wakeOverrides:{},
  familyVisit:{enabled:false,startDate:'',endDate:'',currentWeek:false},weekTypeOverride:'auto',normalWeeklyStudyHours:34.5,englishWeeklyHours:2.75,familyLearningMinimumMinutes:45,
};

const subjects:AppData['subjects']=[
  {id:'economics',name:'經濟學',shortName:'經濟',color:'#7fa8df',originalVideoHours:200,completedOriginalHours:0,speed:1.25,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
  {id:'finance',name:'財務管理',shortName:'財管',color:'#d8b978',originalVideoHours:100,completedOriginalHours:0,speed:1.25,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
  {id:'statistics',name:'統計學',shortName:'統計',color:'#75c7aa',originalVideoHours:100,completedOriginalHours:0,speed:1.25,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
  {id:'english',name:'英文',shortName:'英文',color:'#ae91d7',originalVideoHours:0,completedOriginalHours:0,speed:1,reviewHours:0,questions:0,wrongQuestions:0,pastPapers:0,exp:0},
];

export const seedData:AppData={
  subjects,tasks:generateWeekSchedule('2026-09-07',defaultSettings),sessions:[],settledWeeks:[],generatedScheduleDates:['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-09-13'],
  player:{name:'備考冒險者',exp:0,coins:0,streak:0},
  milestones:[
    {id:'m1',date:'2026-09-30',title:'第一補給站',targetPercent:18,description:'三科影片完成約 15–20%'},{id:'m2',date:'2026-10-31',title:'中段據點',targetPercent:48,description:'三科影片完成約 45–50%'},
    {id:'m3',date:'2026-11-30',title:'最終整備',targetPercent:83,description:'三科影片完成約 80–85%'},{id:'m4',date:'2026-12-12',title:'影片全破',targetPercent:100,description:'三科補習班影片完成'},
    {id:'m5',date:'2026-12-25',title:'第一輪完整',targetPercent:100,description:'影片＋複習＋題目完成第一輪'},
  ],settings:defaultSettings,
};
