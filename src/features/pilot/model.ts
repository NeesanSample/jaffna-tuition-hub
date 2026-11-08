import type { Session, Student } from '../../domain/entities'
import type { Attendance, AttendanceStatus, Enrolment, Invoice, Payment, TuitionClass } from '../../domain/operations'
export const PILOT_KEY='vcm-pilot-v1'
export interface PilotStudent extends Student { number:string;school:string;studentPhone:string;admittedOn:string;status:'Active'|'Inactive';qrToken:string;photo?:string }
export interface Slot { day:number;time:string;duration:number }
export interface Batch extends TuitionClass { year:number;slots:Slot[];active:boolean }
export interface Membership extends Enrolment { endedOn?:string }
export interface ClassSession { id:string;batchId:string;date:string;time:string;duration:number;closed:boolean }
export interface Mark extends Attendance { sessionId:string;scannedAt?:string;recordedBy:string }
export interface Bill extends Invoice { discountCents:number;discountReason:string }
export interface Collection extends Payment { receipt:string;recordedBy:string;note:string;voidedAt?:string;voidReason?:string;voidedBy?:string }
export interface Staff { id:string;name:string;username:string;role:'Centre admin'|'Branch staff';active:boolean }
export interface PilotSession extends Session { userId:string;token:string;expiresAt:number }
export interface Audit { id:string;at:string;actorId:string;action:string;detail:string;sessionId?:string;studentId?:string }
export interface GradeConfig { name:string;multipleBatches:boolean }
export interface Settings { name:string;address:string;phone:string;receiptPrefix:string;logo:string;cardNote:string;currency:'LKR';timezone:'Asia/Colombo';grades?:GradeConfig[];studentPrefix?:string }
export interface PilotData { version:1;nextStudent:number;nextReceipt:number;students:PilotStudent[];batches:Batch[];enrolments:Membership[];sessions:ClassSession[];attendance:Mark[];invoices:Bill[];payments:Collection[];users:Staff[];audit:Audit[];settings:Settings }
export interface StudentInput { name:string;grade:string;school:string;studentPhone:string;guardian:string;phone:string;admittedOn:string;status:'Active'|'Inactive';batchIds:string[];photo?:string }
export type MarkStatus=AttendanceStatus|''
export function today(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
export function weekday(date:string){return new Date(`${date}T12:00:00+05:30`).getUTCDay()}
export function validDate(date:string){return /^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)===date}
export const week=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
export function minutes(time:string){const [h,m]=time.split(':').map(Number);return h*60+m}
export function overlap(a:Slot,b:Slot){return a.day===b.day&&minutes(a.time)<minutes(b.time)+b.duration&&minutes(b.time)<minutes(a.time)+a.duration}
export function paid(d:PilotData,id:string){return d.payments.filter(p=>p.invoiceId===id&&!p.voidedAt).reduce((n,p)=>n+p.amountCents,0)}
export function due(d:PilotData,i:Bill){return i.amountCents-i.discountCents-paid(d,i.id)}
export function activeOn(e:Membership,date:string){return e.joinedOn<=date&&(!e.endedOn||e.endedOn>date)}
export function nameOf(d:PilotData,id:string){return d.users.find(u=>u.id===id)?.name||'Former staff member'}
export function gradeSetup(d:PilotData):GradeConfig[]{return d.settings.grades??[...new Set(['Grade 12','Grade 13',...d.students.map(s=>s.grade),...d.batches.map(b=>b.grade)])].sort((a,b)=>Number(a.slice(6))-Number(b.slice(6))).map(name=>({name,multipleBatches:d.batches.filter(b=>b.grade===name&&b.active).length>1}))}
export function allGrades(d:PilotData){return [...new Set([...gradeSetup(d).map(g=>g.name),...d.students.map(s=>s.grade),...d.batches.map(b=>b.grade)])].sort((a,b)=>Number(a.slice(6))-Number(b.slice(6)))}
export function normalizeStudentPrefix(value:string){return value.trim().toUpperCase().replace(/-+$/,'')}
