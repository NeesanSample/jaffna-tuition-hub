import { academicClock, buildAttendanceReport, gradeLevel, gradeNames, overlaps, scheduleConflicts, timeMinutes, upgradeAcademic } from '../domain/academic'
import type { AcademicGrade, AttendanceReport, CheckInResult, ReportFilter } from '../domain/academic'
import type { Repository } from './mockRepository'
import { repository } from './mockRepository'
import type { Session, Snapshot } from '../domain/entities'
import { OPERATIONS_KEY, days, localDate, paidAmount } from '../domain/operations'
import type { AttendanceStatus, Operations, Payment, Subject, Teacher, TuitionClass } from '../domain/operations'
export interface OperationsRepository {
 snapshot(s:Session):Promise<Operations>
 saveGrade(s:Session,value:Omit<AcademicGrade,'id'|'level'>,id?:string):Promise<void>
 deleteGrade(s:Session,id:string):Promise<void>
 attendanceReport(s:Session,filter:ReportFilter):Promise<AttendanceReport>
 checkIn(s:Session,classId:string,raw:string):Promise<CheckInResult>
 saveSubject(s:Session,value:Omit<Subject,'id'>,id?:string):Promise<void>
 saveTeacher(s:Session,value:Omit<Teacher,'id'>,id?:string):Promise<void>
 deleteSetup(s:Session,kind:'subjects'|'teachers',id:string):Promise<void>
 saveClass(s:Session,value:Omit<TuitionClass,'id'|'createdAt'>,id?:string):Promise<void>
 deleteClass(s:Session,id:string):Promise<void>
 enrol(s:Session,classId:string,studentId:string,joinedOn:string):Promise<void>
 removeEnrolment(s:Session,id:string):Promise<void>
 saveAttendance(s:Session,classId:string,date:string,entries:{studentId:string;status:AttendanceStatus|''}[],reason?:string):Promise<void>
 generateInvoices(s:Session,classId:string,month:string):Promise<number>
 recordPayment(s:Session,invoiceId:string,amountCents:number,date:string,method:Payment['method']):Promise<Payment>
}
function ensure(ok:unknown,message='This action is outside your workspace access.'):asserts ok {if(!ok)throw Error(message)}
function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value}
function validMonth(value:string){return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)}
function validMoney(value:number){return Number.isSafeInteger(value)&&value>0&&value<=100000000}
export function createOperationsRepository(base:Repository,storage:Pick<Storage,'getItem'|'setItem'>,clock:()=>Date=()=>new Date()):OperationsRepository {
 const write=(d:Operations)=>{try{storage.setItem(OPERATIONS_KEY,JSON.stringify(d))}catch{throw Error('Changes could not be saved. Check browser storage and try again.')}}
 const read=async():Promise<Operations>=>{
  let raw=storage.getItem(OPERATIONS_KEY)
  if(!raw){const catalog=await base.catalog();raw=storage.getItem(OPERATIONS_KEY);if(!raw){const date=clock().toISOString();const d:Operations={version:1,subjects:[],teachers:[],classes:[],enrolments:[],attendance:[],invoices:[],payments:[],grades:[],audit:[]};catalog.centres.forEach((c,i)=>{d.subjects.push({id:`subject-${c.id}`,centreId:c.id,name:i%2?'Science':'Mathematics'});d.teachers.push({id:`teacher-${c.id}`,centreId:c.id,name:i%2?'Tharshini Rajendran':'S. Kanthasamy',phone:i%2?'0772345678':'0771234567'})});catalog.branches.forEach((b,i)=>{d.classes.push({id:`class-${b.id}`,centreId:b.centreId,branchId:b.id,name:`${b.name} · Grade 10`,subjectId:`subject-${b.centreId}`,teacherId:`teacher-${b.centreId}`,grade:'Grade 10',day:days[(i+5)%7],time:'16:00',capacity:30,monthlyFeeCents:250000,createdAt:date})});upgradeAcademic(d,catalog);write(d);return d}}
  let d:Operations
  try{d=JSON.parse(raw!);ensure(d.version===1&&['subjects','teachers','classes','enrolments','attendance','invoices','payments'].every(key=>Array.isArray(d[key as keyof Operations])));ensure(d.academicRevision===undefined||d.academicRevision===1);ensure(d.grades===undefined||Array.isArray(d.grades));ensure(d.audit===undefined||Array.isArray(d.audit));if(d.academicRevision===1)ensure(Array.isArray(d.grades)&&Array.isArray(d.audit))}catch{throw Error('Academic demo data cannot be read. Existing records have been preserved.')}
  if(d.academicRevision!==1){const catalog=await base.catalog();upgradeAcademic(d,catalog);write(d)}return d
 }
 let queue:Promise<unknown>=Promise.resolve()
 const run=<T,>(s:Session,fn:(d:Operations,scope:Snapshot)=>T):Promise<T>=>{const result=queue.then(async()=>{const scope=await base.snapshot(s);const d=await read();return fn(d,scope)});queue=result.then(()=>undefined,()=>undefined);return result}
 const visible=(c:TuitionClass,scope:Snapshot)=>scope.branches.some(b=>b.id===c.branchId&&b.centreId===c.centreId)
 const getClass=(d:Operations,scope:Snapshot,id:string)=>{const c=d.classes.find(c=>c.id===id);ensure(c&&visible(c,scope));return c}
 const admin=(s:Session,scope:Snapshot,centreId:string)=>ensure(s.role!=='Branch staff'&&scope.centres.some(c=>c.id===centreId))
 const select=(d:Operations,scope:Snapshot,s:Session):Operations=>{const classes=d.classes.filter(c=>visible(c,scope));const ids=new Set(classes.map(c=>c.id));const invoices=d.invoices.filter(i=>ids.has(i.classId));const invoiceIds=new Set(invoices.map(i=>i.id));return {...d,classes,grades:d.grades.filter(g=>scope.centres.some(c=>c.id===g.centreId)),audit:d.audit.filter(a=>ids.has(a.classId)),subjects:d.subjects.filter(v=>scope.centres.some(c=>c.id===v.centreId)&&(s.role!=='Branch staff'||classes.some(c=>c.subjectId===v.id)||d.teachers.some(t=>t.centreId===v.centreId&&t.branchIds?.includes(s.branchId)&&t.subjectIds?.includes(v.id)))),teachers:d.teachers.filter(v=>scope.centres.some(c=>c.id===v.centreId)&&(s.role!=='Branch staff'||v.branchIds?.includes(s.branchId))),enrolments:d.enrolments.filter(e=>ids.has(e.classId)),attendance:d.attendance.filter(a=>ids.has(a.classId)),invoices,payments:d.payments.filter(p=>invoiceIds.has(p.invoiceId))}}
 const audit=(d:Operations,s:Session,classId:string,studentId:string,date:string,before:AttendanceStatus|'',after:AttendanceStatus|'',source:'manual'|'qr',reason:string)=>{d.audit.push({id:crypto.randomUUID(),classId,studentId,date,before,after,source,actorRole:s.role,reason,changedAt:clock().toISOString()})}
 return {
  saveGrade:(s,v,id)=>run(s,(d,scope)=>{admin(s,scope,v.centreId);ensure(gradeNames.includes(v.name),'Choose a supported Sri Lankan grade (6–13).');const existing=id?d.grades.find(g=>g.id===id&&g.centreId===v.centreId):undefined;if(id)ensure(existing);ensure(!d.grades.some(g=>g.id!==id&&g.centreId===v.centreId&&g.name===v.name),'This grade is already configured.');if(existing&&existing.name!==v.name)ensure(!d.classes.some(c=>c.centreId===v.centreId&&c.grade===existing.name)&&!scope.students.some(x=>x.centreId===v.centreId&&x.grade===existing.name)&&!d.subjects.some(x=>x.centreId===v.centreId&&x.grades?.includes(existing.name)),'This grade has students, subjects or batches and cannot be renamed.');const entity={...v,id:id||crypto.randomUUID(),level:gradeLevel(v.name)};d.grades=id?d.grades.map(g=>g.id===id?entity:g):[...d.grades,entity];write(d)}),
  deleteGrade:(s,id)=>run(s,(d,scope)=>{const grade=d.grades.find(g=>g.id===id);ensure(grade);admin(s,scope,grade.centreId);ensure(!d.classes.some(c=>c.centreId===grade.centreId&&c.grade===grade.name)&&!scope.students.some(x=>x.centreId===grade.centreId&&x.grade===grade.name)&&!d.subjects.some(x=>x.centreId===grade.centreId&&x.grades?.includes(grade.name)),'This grade has students, subjects or batches and cannot be deleted.');d.grades=d.grades.filter(g=>g.id!==id);write(d)}),
  attendanceReport:(s,filter)=>run(s,(d,scope)=>{ensure(validDate(filter.from)&&validDate(filter.to)&&filter.from<=filter.to&&filter.to<=academicClock(clock()).date,'Choose a valid reporting range ending today or earlier.');ensure(Date.parse(filter.to)-Date.parse(filter.from)<=92*86400000,'Limit the report to 93 days.');const scoped=select(d,scope,s);ensure(!filter.branchId||scope.branches.some(b=>b.id===filter.branchId));ensure(!filter.teacherId||scoped.teachers.some(t=>t.id===filter.teacherId));ensure(!filter.classId||scoped.classes.some(c=>c.id===filter.classId));return buildAttendanceReport(scoped,filter)}),
  checkIn:(s,classId,raw)=>run(s,(d,scope)=>{
   const batch=getClass(d,scope,classId);ensure(raw.trim()&&raw.length<=4096,'Scan or paste a valid student QR identity.');let payload:{studentId?:unknown;centreId?:unknown;branchId?:unknown;version?:unknown}
   try{payload=raw.trim().startsWith('{')?JSON.parse(raw):{studentId:raw.trim()}}catch{throw Error('The QR identity is not valid JSON or a student ID.')}
   ensure(payload&&typeof payload.studentId==='string'&&(payload.version===undefined||payload.version===1),'This is not a supported student QR identity.')
   const student=scope.students.find(v=>v.id===payload.studentId);ensure(student&&student.branchId===batch.branchId&&student.centreId===batch.centreId,'This student does not belong to the selected batch’s branch.')
   ensure((payload.centreId===undefined||payload.centreId===student.centreId)&&(payload.branchId===undefined||payload.branchId===student.branchId),'The QR centre or branch does not match the student identity.')
   const now=academicClock(clock());ensure(d.enrolments.some(e=>e.classId===classId&&e.studentId===student.id&&e.joinedOn<=now.date),'This student is not enrolled in the selected batch.')
   const start=timeMinutes(batch.time);ensure(now.day===batch.day&&now.minutes>=start-30&&now.minutes<start+(batch.durationMinutes??90),'QR check-in is available on the scheduled day, from 30 minutes before the batch starts until it ends (Sri Lanka time).')
   const existing=d.attendance.find(a=>a.classId===classId&&a.studentId===student.id&&a.date===now.date)
   if(existing){ensure(existing.status==='present'||existing.status==='late','Attendance was already marked absent or excused. Use a manual correction with a reason.');return {student,status:existing.status,duplicate:true}}
   const status:AttendanceStatus=now.minutes>start+(batch.lateAfterMinutes??10)?'late':'present'
   d.attendance.push({id:crypto.randomUUID(),classId,studentId:student.id,date:now.date,status,source:'qr'});audit(d,s,classId,student.id,now.date,'',status,'qr','Student QR check-in');write(d);return {student,status,duplicate:false}
  }),

  snapshot:s=>run(s,(d,scope)=>select(d,scope,s)),
  saveSubject:(s,v,id)=>run(s,(d,scope)=>{
   admin(s,scope,v.centreId);ensure(v.name.trim().length>=2,'Enter a subject name with at least 2 characters.')
   const grades=v.grades??d.grades.filter(g=>g.centreId===v.centreId).map(g=>g.name)
   ensure(grades.length&&grades.every(name=>d.grades.some(g=>g.centreId===v.centreId&&g.name===name)),'Select configured grades from this centre.')
   if(id)ensure(d.subjects.some(x=>x.id===id&&x.centreId===v.centreId))
   ensure(!d.classes.some(c=>c.subjectId===id&&!grades.includes(c.grade)),'An assigned batch still uses a grade you are removing.')
   ensure(!d.subjects.some(x=>x.id!==id&&x.centreId===v.centreId&&x.name.toLowerCase()===v.name.trim().toLowerCase()),'This subject already exists in this centre.')
   const entity={...v,grades:[...new Set(grades)],name:v.name.trim(),id:id||crypto.randomUUID()};d.subjects=id?d.subjects.map(x=>x.id===id?entity:x):[...d.subjects,entity];write(d)
  }),
  saveTeacher:(s,v,id)=>run(s,(d,scope)=>{
   admin(s,scope,v.centreId);ensure(v.name.trim().length>=2&&/^0\d{9}$/.test(v.phone),'Enter a teacher name and a 10-digit phone number starting with 0.')
   const existing=id?d.teachers.find(x=>x.id===id&&x.centreId===v.centreId):undefined;if(id)ensure(existing)
   const subjectIds=v.subjectIds??existing?.subjectIds??d.subjects.filter(x=>x.centreId===v.centreId).map(x=>x.id)
   const branchIds=v.branchIds??existing?.branchIds??scope.branches.filter(b=>b.centreId===v.centreId).map(b=>b.id)
   ensure(subjectIds.length&&branchIds.length,'Assign at least one subject and branch.')
   ensure(subjectIds.every(id=>d.subjects.some(x=>x.id===id&&x.centreId===v.centreId))&&branchIds.every(id=>scope.branches.some(b=>b.id===id&&b.centreId===v.centreId)),'Assignments must belong to the teacher’s centre.')
   ensure(!d.classes.some(c=>c.teacherId===id&&(!subjectIds.includes(c.subjectId)||!branchIds.includes(c.branchId))),'Update the teacher’s assigned batches before removing these assignments.')
   const entity={...v,subjectIds:[...new Set(subjectIds)],branchIds:[...new Set(branchIds)],name:v.name.trim(),id:id||crypto.randomUUID()};d.teachers=id?d.teachers.map(x=>x.id===id?entity:x):[...d.teachers,entity];write(d)
  }),
  deleteSetup:(s,kind,id)=>run(s,(d,scope)=>{const item=d[kind].find(v=>v.id===id);ensure(item);admin(s,scope,item.centreId);ensure(!d.classes.some(c=>(kind==='subjects'?c.subjectId:c.teacherId)===id),'This record is assigned to a class. Update or delete that class first.');if(kind==='subjects')ensure(!d.teachers.some(t=>t.subjectIds?.includes(id)),'Remove this subject from teacher assignments before deleting it.');if(kind==='subjects')d.subjects=d.subjects.filter(x=>x.id!==id);else d.teachers=d.teachers.filter(x=>x.id!==id);write(d)}),
  saveClass:(s,v,id)=>run(s,(d,scope)=>{admin(s,scope,v.centreId);ensure(scope.branches.some(b=>b.id===v.branchId&&b.centreId===v.centreId));ensure(d.subjects.some(x=>x.id===v.subjectId&&x.centreId===v.centreId)&&d.teachers.some(x=>x.id===v.teacherId&&x.centreId===v.centreId),'Choose a subject and teacher from the same centre.');ensure(v.name.trim().length>=2&&d.grades.some(g=>g.centreId===v.centreId&&g.name===v.grade)&&days.includes(v.day)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time),'Check class name, grade and timetable.');ensure(Number.isInteger(v.capacity)&&v.capacity>=1&&v.capacity<=500&&validMoney(v.monthlyFeeCents),'Capacity must be 1–500 and monthly fee must be greater than zero (maximum LKR 1,000,000).');const existing=id?getClass(d,scope,id):undefined;if(existing)ensure(existing.branchId===v.branchId&&existing.centreId===v.centreId,'A class cannot be moved to another branch.');ensure(d.enrolments.filter(e=>e.classId===id).length<=v.capacity,'Capacity cannot be below the current enrolment count.');if(existing&&d.enrolments.some(e=>e.classId===id))ensure(existing.grade===v.grade,'Remove unused enrolments before changing the grade.');ensure(!d.classes.some(c=>c.id!==id&&c.branchId===v.branchId&&c.name.toLowerCase()===v.name.trim().toLowerCase()),'This class name already exists in this branch.');const teacher=d.teachers.find(t=>t.id===v.teacherId)!;const subject=d.subjects.find(x=>x.id===v.subjectId)!
   ensure(teacher.branchIds?.includes(v.branchId)&&teacher.subjectIds?.includes(v.subjectId),'The teacher must be assigned to this branch and subject.');ensure(subject.grades?.includes(v.grade),'The subject is not assigned to this grade.')
   const durationMinutes=v.durationMinutes??existing?.durationMinutes??90;const lateAfterMinutes=v.lateAfterMinutes??existing?.lateAfterMinutes??10;const classroom=(v.classroom??existing?.classroom??'Room 1').trim()
   ensure(Number.isInteger(durationMinutes)&&durationMinutes>=15&&durationMinutes<=480&&timeMinutes(v.time)+durationMinutes<=1440,'Duration must be 15–480 minutes and finish by midnight.')
   ensure(classroom.length>=2&&classroom.length<=80&&Number.isInteger(lateAfterMinutes)&&lateAfterMinutes>=0&&lateAfterMinutes<durationMinutes,'Enter a classroom and a lateness grace period shorter than the batch.')
   const entity={...v,classroom,durationMinutes,lateAfterMinutes,name:v.name.trim(),id:id||crypto.randomUUID(),createdAt:existing?.createdAt||clock().toISOString()}
   const conflicts=scheduleConflicts(d.classes,entity,d.enrolments);ensure(!conflicts.length,conflicts.join(' '));d.classes=id?d.classes.map(c=>c.id===id?entity:c):[...d.classes,entity];write(d)}),
  deleteClass:(s,id)=>run(s,(d,scope)=>{const c=getClass(d,scope,id);admin(s,scope,c.centreId);ensure(!d.enrolments.some(e=>e.classId===id)&&!d.attendance.some(a=>a.classId===id)&&!d.invoices.some(i=>i.classId===id)&&!d.audit.some(a=>a.classId===id),'This class has enrolments or records. It cannot be deleted.');d.classes=d.classes.filter(c=>c.id!==id);write(d)}),
  enrol:(s,classId,studentId,joinedOn)=>run(s,(d,scope)=>{const c=getClass(d,scope,classId);const student=scope.students.find(v=>v.id===studentId);ensure(student&&student.centreId===c.centreId&&student.branchId===c.branchId,'The student must belong to this class’s branch.');ensure(student.grade===c.grade,'The student’s grade must match the class grade.');ensure(validDate(joinedOn)&&joinedOn<=academicClock(clock()).date&&joinedOn>=academicClock(new Date(c.createdAt)).date,'Choose a joining date between the class creation date and today.');ensure(!d.enrolments.some(e=>e.classId===classId&&e.studentId===studentId),'This student is already enrolled.');ensure(d.enrolments.filter(e=>e.classId===classId).length<c.capacity,'This class is full.');ensure(!d.enrolments.some(e=>e.studentId===studentId&&d.classes.some(other=>other.id===e.classId&&overlaps(c,other))),'This student is enrolled in another batch at the same time.');d.enrolments.push({id:crypto.randomUUID(),classId,studentId,joinedOn});write(d)}),
  removeEnrolment:(s,id)=>run(s,(d,scope)=>{const e=d.enrolments.find(e=>e.id===id);ensure(e);getClass(d,scope,e.classId);ensure(!d.attendance.some(a=>a.classId===e.classId&&a.studentId===e.studentId)&&!d.invoices.some(i=>i.classId===e.classId&&i.studentId===e.studentId)&&!d.audit.some(a=>a.classId===e.classId&&a.studentId===e.studentId),'Attendance or fee history exists. This enrolment must be retained.');d.enrolments=d.enrolments.filter(e=>e.id!==id);write(d)}),
  saveAttendance:(s,classId,date,entries,reason='')=>run(s,(d,scope)=>{
   getClass(d,scope,classId);ensure(validDate(date)&&date<=academicClock(clock()).date,'Choose a valid attendance date that is not in the future.')
   ensure(new Set(entries.map(e=>e.studentId)).size===entries.length,'A student can appear only once in the register.')
   for(const entry of entries){ensure(d.enrolments.some(e=>e.classId===classId&&e.studentId===entry.studentId&&e.joinedOn<=date),'A student was not enrolled on the selected date.');ensure(['','present','absent','late','excused'].includes(entry.status),'Choose a valid attendance status.')
    const before=d.attendance.find(a=>a.classId===classId&&a.studentId===entry.studentId&&a.date===date)?.status??''
    const historical=!!before||d.audit.some(a=>a.classId===classId&&a.studentId===entry.studentId&&a.date===date)
    if(before!==entry.status&&historical)ensure(reason.trim().length>=5,'Add a correction reason of at least 5 characters.');}
   for(const entry of entries){const before=d.attendance.find(a=>a.classId===classId&&a.studentId===entry.studentId&&a.date===date)?.status??'';if(before===entry.status)continue
    d.attendance=d.attendance.filter(a=>!(a.classId===classId&&a.studentId===entry.studentId&&a.date===date));if(entry.status)d.attendance.push({id:crypto.randomUUID(),classId,studentId:entry.studentId,date,status:entry.status,source:'manual'})
    audit(d,s,classId,entry.studentId,date,before,entry.status,'manual',reason.trim()||'Initial attendance register')
   }write(d)
  }),
  generateInvoices:(s,classId,month)=>run(s,(d,scope)=>{const c=getClass(d,scope,classId);ensure(validMonth(month)&&month>=localDate(new Date(c.createdAt)).slice(0,7),'Choose a valid month on or after this class was created.');const eligible=d.enrolments.filter(e=>e.classId===classId&&e.joinedOn.slice(0,7)<=month);ensure(eligible.length,'There are no eligible enrolled students for this month.');let count=0;for(const e of eligible){if(!d.invoices.some(i=>i.classId===classId&&i.studentId===e.studentId&&i.month===month)){d.invoices.push({id:crypto.randomUUID(),classId,studentId:e.studentId,month,amountCents:c.monthlyFeeCents,createdAt:clock().toISOString()});count++}}if(count)write(d);return count}),
  recordPayment:(s,invoiceId,amountCents,date,method)=>run(s,(d,scope)=>{const invoice=d.invoices.find(i=>i.id===invoiceId);ensure(invoice);getClass(d,scope,invoice.classId);ensure(validMoney(amountCents),'Enter a positive amount with at most two decimal places.');ensure(validDate(date)&&date<=localDate(clock())&&date>=localDate(new Date(invoice.createdAt)),'Payment date must be between invoice creation and today.');ensure(['Cash','Bank transfer'].includes(method),'Choose a payment method.');ensure(amountCents<=invoice.amountCents-paidAmount(d,invoiceId),'This amount exceeds the outstanding balance.');const payment:Payment={id:`RCP-${crypto.randomUUID()}`,invoiceId,amountCents,date,method,createdAt:clock().toISOString()};d.payments.push(payment);write(d);return payment}),
 }
}
export const operationsRepository=createOperationsRepository(repository,{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)})




