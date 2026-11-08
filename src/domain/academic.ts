import type { Branch, Centre, Student } from './entities'
import type { AttendanceStatus, Enrolment, Operations, TuitionClass } from './operations'
export const gradeNames=Array.from({length:8},(_,i)=>`Grade ${i+6}`)
export function gradeLevel(name:string){const n=Number(name.split(' ')[1]);return n>=12?'A/L':n>=10?'O/L':'Secondary'}
export interface AcademicGrade { id:string; centreId:string; name:string; level:string }
export interface AttendanceAudit { id:string; classId:string; studentId:string; date:string; before:AttendanceStatus|''; after:AttendanceStatus|''; source:'manual'|'qr'; actorRole:string; reason:string; changedAt:string }
export interface ReportFilter { from:string; to:string; branchId?:string; teacherId?:string; classId?:string }
export interface AttendanceTotals { expected:number; present:number; late:number; absent:number; excused:number; unmarked:number; rate:number }
export interface AttendanceReport { totals:AttendanceTotals; batches:({classId:string;name:string;branchId:string;teacherId:string}&AttendanceTotals)[] }
export interface CheckInResult { student:Student;status:AttendanceStatus;duplicate:boolean }
export function academicClock(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date)
 const get=(type:string)=>parts.find(p=>p.type===type)?.value||''
 return {date:`${get('year')}-${get('month')}-${get('day')}`,day:get('weekday'),minutes:Number(get('hour'))*60+Number(get('minute'))}
}
export function timeMinutes(time:string){const [h,m]=time.split(':').map(Number);return h*60+m}
export function endTime(c:Pick<TuitionClass,'time'|'durationMinutes'>){const n=timeMinutes(c.time)+(c.durationMinutes??90);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
export function overlaps(a:TuitionClass,b:TuitionClass){return a.day===b.day&&timeMinutes(a.time)<timeMinutes(b.time)+(b.durationMinutes??90)&&timeMinutes(b.time)<timeMinutes(a.time)+(a.durationMinutes??90)}
export function scheduleConflicts(classes:TuitionClass[],candidate:TuitionClass,enrolments:Enrolment[]=[]){
 const students=new Set(enrolments.filter(e=>e.classId===candidate.id).map(e=>e.studentId));const errors:string[]=[]
 for(const c of classes){if(c.id===candidate.id||c.centreId!==candidate.centreId||!overlaps(c,candidate))continue
  if(c.teacherId===candidate.teacherId)errors.push(`Teacher overlaps with “${c.name}” (${c.day} ${c.time}–${endTime(c)}).`)
  if(c.branchId===candidate.branchId&&(c.classroom??'Room 1').trim().toLowerCase()===(candidate.classroom??'Room 1').trim().toLowerCase())errors.push(`Classroom overlaps with “${c.name}”.`)
  if(enrolments.some(e=>e.classId===c.id&&students.has(e.studentId)))errors.push(`An enrolled student has an overlapping batch: “${c.name}”.`)
 }
 return errors
}
export function upgradeAcademic(d:Operations,catalog:{centres:Centre[];branches:Branch[]}){
 if(d.academicRevision===1)return false
 const existing=d.grades??[];d.grades=[...existing,...catalog.centres.flatMap(c=>gradeNames.filter(name=>!existing.some(g=>g.centreId===c.id&&g.name===name)).map(name=>({id:`grade-${c.id}-${name.split(' ')[1]}`,centreId:c.id,name,level:gradeLevel(name)})))]
 d.audit=d.audit??[]
 d.subjects=d.subjects.map(s=>({...s,grades:s.grades??[...gradeNames]}))
 d.teachers=d.teachers.map(t=>({...t,subjectIds:t.subjectIds??d.subjects.filter(s=>s.centreId===t.centreId).map(s=>s.id),branchIds:t.branchIds??catalog.branches.filter(b=>b.centreId===t.centreId).map(b=>b.id)}))
 d.classes=d.classes.map(c=>({...c,classroom:c.classroom??'Room 1',durationMinutes:c.durationMinutes??90,lateAfterMinutes:c.lateAfterMinutes??10}))
 d.academicRevision=1;return true
}
const emptyTotals=():AttendanceTotals=>({expected:0,present:0,late:0,absent:0,excused:0,unmarked:0,rate:0})
export function buildAttendanceReport(d:Operations,filter:ReportFilter):AttendanceReport{
 const classes=d.classes.filter(c=>(!filter.branchId||c.branchId===filter.branchId)&&(!filter.teacherId||c.teacherId===filter.teacherId)&&(!filter.classId||c.id===filter.classId));const totals=emptyTotals()
 const batches=classes.map(c=>{const counts=emptyTotals();const members=d.enrolments.filter(e=>e.classId===c.id);const created=academicClock(new Date(c.createdAt)).date
  for(let day=new Date(filter.from+'T12:00:00Z');day.toISOString().slice(0,10)<=filter.to;day.setUTCDate(day.getUTCDate()+1)){const date=day.toISOString().slice(0,10);if(date<created)continue;const weekday=new Intl.DateTimeFormat('en-GB',{weekday:'long',timeZone:'UTC'}).format(day);const extra=d.attendance.some(a=>a.classId===c.id&&a.date===date)||d.audit.some(a=>a.classId===c.id&&a.date===date);if(weekday!==c.day&&!extra)continue
   for(const e of members.filter(e=>e.joinedOn<=date)){counts.expected++;const record=d.attendance.find(a=>a.classId===c.id&&a.studentId===e.studentId&&a.date===date);if(record)counts[record.status]++;else counts.unmarked++}
  }
  const denominator=counts.present+counts.late+counts.absent;counts.rate=denominator?Math.round((counts.present+counts.late)/denominator*100):0
  for(const key of ['expected','present','late','absent','excused','unmarked'] as const)totals[key]+=counts[key]
  return {...counts,classId:c.id,name:c.name,branchId:c.branchId,teacherId:c.teacherId}
 });const denominator=totals.present+totals.late+totals.absent;totals.rate=denominator?Math.round((totals.present+totals.late)/denominator*100):0;return {totals,batches}
}

