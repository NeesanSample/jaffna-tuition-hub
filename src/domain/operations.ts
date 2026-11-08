import type { AcademicGrade, AttendanceAudit } from './academic'
export const OPERATIONS_KEY = 'jth-operations-v1'
export interface Subject { id:string; centreId:string; name:string; grades?:string[] }
export interface Teacher { id:string; centreId:string; name:string; phone:string; subjectIds?:string[]; branchIds?:string[] }
export interface TuitionClass { id:string; centreId:string; branchId:string; name:string; subjectId:string; teacherId:string; grade:string; day:string; time:string; capacity:number; monthlyFeeCents:number; createdAt:string; classroom?:string; durationMinutes?:number; lateAfterMinutes?:number }
export interface Enrolment { id:string; classId:string; studentId:string; joinedOn:string }
export type AttendanceStatus = 'present'|'absent'|'late'|'excused'
export interface Attendance { id:string; classId:string; studentId:string; date:string; status:AttendanceStatus; source?:'manual'|'qr' }
export interface Invoice { id:string; classId:string; studentId:string; month:string; amountCents:number; createdAt:string }
export interface Payment { id:string; invoiceId:string; amountCents:number; date:string; method:'Cash'|'Bank transfer'; createdAt:string }
export interface Operations { version:1; subjects:Subject[]; teachers:Teacher[]; classes:TuitionClass[]; enrolments:Enrolment[]; attendance:Attendance[]; invoices:Invoice[]; payments:Payment[]; grades:AcademicGrade[]; audit:AttendanceAudit[]; academicRevision?:1 }
export const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
export function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function money(cents:number){return new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR'}).format(cents/100)}
export function paidAmount(data:Operations,invoiceId:string){return data.payments.filter(p=>p.invoiceId===invoiceId).reduce((sum,p)=>sum+p.amountCents,0)}
