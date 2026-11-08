import { gradeNames } from '../domain/academic'
import type { Branch, Centre, Database, Session, Snapshot, Student } from '../domain/entities'
import { initialData } from './migrate'
export const STORAGE_KEY = 'jth-database-v1'
export interface Repository {
  catalog(): Promise<{ centres: Centre[]; branches: Branch[] }>
  snapshot(session: Session): Promise<Snapshot>
  student(session: Session, id: string): Promise<Student>
  saveCentre(session: Session, value: Omit<Centre, 'id'>, id?: string): Promise<void>
  deleteCentre(session: Session, id: string): Promise<void>
  saveBranch(session: Session, value: Omit<Branch, 'id'>, id?: string): Promise<void>
  deleteBranch(session: Session, id: string): Promise<void>
  registerStudent(session: Session, value: Omit<Student, 'id' | 'createdAt'>): Promise<Student>
}
const requireAccess = (condition: boolean) => { if (!condition) throw new Error('This action is outside your workspace access.') }
const validLocation = (v: Omit<Centre, 'id'>) => { if (v.name.trim().length < 2 || v.address.trim().length < 5 || !/^0\d{9}$/.test(v.phone)) throw new Error('Enter a name, address and a 10-digit Sri Lankan phone number.') }
export function createRepository(storage: Pick<Storage, 'getItem' | 'setItem'>): Repository {
  const read = (): Database => {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) { const data = initialData(storage); storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data }
    try { const data = JSON.parse(raw); if (data.version !== 1 || !Array.isArray(data.centres) || !Array.isArray(data.branches) || !Array.isArray(data.students)) throw Error(); return data }
    catch { throw new Error('Saved demo data cannot be read. Export or clear the jth-database-v1 browser storage entry to reset the demo.') }
  }
  const protectOperations=(kind:'centre'|'branch',id:string)=>{const raw=storage.getItem('jth-operations-v1');if(!raw)return;let data;try{data=JSON.parse(raw);if(!Array.isArray(data.classes)||!Array.isArray(data.subjects)||!Array.isArray(data.teachers))throw Error()}catch{throw Error('Phase 2 records cannot be checked. This location has been kept.')}if(data.classes.some((c:{centreId:string;branchId:string})=>(kind==='centre'?c.centreId:c.branchId)===id)||(kind==='branch'&&data.teachers.some((v:{branchIds?:string[]})=>v.branchIds?.includes(id)))||(kind==='centre'&&[...data.subjects,...data.teachers,...(data.grades||[])].some((v:{centreId:string})=>v.centreId===id)))throw Error('This location has Phase 2 teaching records. Remove those records before deleting it.')}
  const write = (data: Database) => { try { storage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { throw new Error('Changes could not be saved. Check browser storage availability and try again.') } }
  const check = (d: Database, s: Session) => {
    requireAccess(['Platform admin', 'Centre admin', 'Branch staff'].includes(s.role))
    if (s.role !== 'Platform admin') requireAccess(d.centres.some(c => c.id === s.centreId))
    if (s.role === 'Branch staff') requireAccess(d.branches.some(b => b.id === s.branchId && b.centreId === s.centreId))
  }
  const tenant = (s: Session, id: string) => s.role === 'Platform admin' || s.centreId === id
  const branchAccess = (s: Session, b: Branch) => tenant(s, b.centreId) && (s.role !== 'Branch staff' || s.branchId === b.id)
  const run = async <T,>(fn: (d: Database) => T): Promise<T> => { await new Promise(r => setTimeout(r, 100)); return fn(read()) }
  return {
    catalog: () => run(d => ({ centres: d.centres, branches: d.branches })),
    snapshot: s => run(d => { check(d,s); return { centres: d.centres.filter(c=>tenant(s,c.id)), branches: d.branches.filter(b=>branchAccess(s,b)), students: d.students.filter(v=>tenant(s,v.centreId)&&(s.role!=='Branch staff'||v.branchId===s.branchId)) } }),
    student: (s,id) => run(d => { check(d,s); const v=d.students.find(v=>v.id===id); requireAccess(!!v && tenant(s,v.centreId) && (s.role!=='Branch staff'||v.branchId===s.branchId)); return v! }),
    saveCentre: (s,v,id) => run(d => { check(d,s); requireAccess(s.role==='Platform admin'||(s.role==='Centre admin'&&id===s.centreId)); validLocation(v); if(id) requireAccess(d.centres.some(c=>c.id===id)); if(d.centres.some(c=>c.id!==id&&c.name.toLowerCase()===v.name.trim().toLowerCase())) throw Error('A centre with this name already exists.'); const entity={...v,name:v.name.trim(),id:id||crypto.randomUUID()}; d.centres=id?d.centres.map(c=>c.id===id?entity:c):[...d.centres,entity]; write(d) }),
    deleteCentre: (s,id) => run(d => { check(d,s); requireAccess(s.role==='Platform admin'&&d.centres.some(c=>c.id===id)); protectOperations('centre',id); if(d.branches.some(b=>b.centreId===id)||d.students.some(v=>v.centreId===id)) throw Error('Remove associated students and branches before deleting this centre.'); d.centres=d.centres.filter(c=>c.id!==id); write(d) }),
    saveBranch: (s,v,id) => run(d => { check(d,s); requireAccess(s.role!=='Branch staff'&&tenant(s,v.centreId)&&d.centres.some(c=>c.id===v.centreId)); validLocation(v); if(id) requireAccess(d.branches.some(b=>b.id===id&&b.centreId===v.centreId)); if(d.branches.some(b=>b.id!==id&&b.centreId===v.centreId&&b.name.toLowerCase()===v.name.trim().toLowerCase())) throw Error('A branch with this name already exists in this centre.'); const entity={...v,name:v.name.trim(),id:id||crypto.randomUUID()}; d.branches=id?d.branches.map(b=>b.id===id?entity:b):[...d.branches,entity]; write(d) }),
    deleteBranch: (s,id) => run(d => { check(d,s); const b=d.branches.find(b=>b.id===id); requireAccess(s.role!=='Branch staff'&&!!b&&branchAccess(s,b)); protectOperations('branch',id); if(d.students.some(v=>v.branchId===id)) throw Error('This branch has registered students and cannot be deleted.'); d.branches=d.branches.filter(b=>b.id!==id); write(d) }),
    registerStudent: (s,v) => run(d => { check(d,s); const b=d.branches.find(b=>b.id===v.branchId&&b.centreId===v.centreId); requireAccess(!!b&&branchAccess(s,b)); if(v.name.trim().length<2||!v.guardian.trim()||!/^0\d{9}$/.test(v.phone)||!gradeNames.includes(v.grade)) throw Error('Check student name, guardian, phone and grade.'); const academicRaw=storage.getItem('jth-operations-v1');if(academicRaw){let academic;try{academic=JSON.parse(academicRaw)}catch{throw Error('Academic setup cannot be read. Student records have been preserved.')}if(academic.grades)requireAccess(academic.grades.some((g:{centreId:string;name:string})=>g.centreId===v.centreId&&g.name===v.grade))}const student={...v,name:v.name.trim(),id:`JTH-${new Date().getFullYear()}-${crypto.randomUUID()}`,createdAt:new Date().toISOString()}; d.students.push(student); write(d); return student }),
  }
}
export const repository = createRepository({ getItem: key=>localStorage.getItem(key), setItem: (key,value)=>localStorage.setItem(key,value) })



