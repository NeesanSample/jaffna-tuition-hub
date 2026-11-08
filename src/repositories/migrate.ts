import type { Database } from '../domain/entities'
import { seed } from './seed'
// The original prototype had no ownership fields. Preserve its records under
// the first legacy centre; leave the original keys intact for recovery.
export function initialData(storage: Pick<Storage, 'getItem'>): Database {
 const base=seed()
 const rawCentres=storage.getItem('jth-centres');const rawBranches=storage.getItem('jth-branches');const rawStudents=storage.getItem('jth-students')
 if(!rawCentres&&!rawBranches&&!rawStudents)return base
 try {
  const names:unknown=rawCentres?JSON.parse(rawCentres):base.centres.map(c=>c.name)
  const places:unknown=rawBranches?JSON.parse(rawBranches):base.branches.map(b=>b.name)
  const learners:unknown=rawStudents?JSON.parse(rawStudents):[]
  if(!Array.isArray(names)||!names.every(n=>typeof n==='string')||!Array.isArray(places)||!places.every(n=>typeof n==='string')||!Array.isArray(learners))throw Error()
  const centres=names.map((name,i)=>({id:`legacy-centre-${i}`,name,address:'Jaffna District (update address)',phone:''}))
  if(!centres.length&&(places.length||learners.length))centres.push({id:'legacy-centre-0',name:'Imported tuition centre',address:'Jaffna District (update address)',phone:''})
  const allPlaces=[...new Set([...places,...learners.map(s=>s.branch)])]
  if(!allPlaces.every(p=>typeof p==='string'))throw Error()
  const branches=allPlaces.map((name,i)=>({id:`legacy-branch-${i}`,centreId:centres[0].id,name,address:'Jaffna District (update address)',phone:''}))
  const students=learners.map(s=>{if(typeof s.id!=='string'||typeof s.name!=='string'||typeof s.grade!=='string')throw Error();return {id:s.id,name:s.name,grade:s.grade,centreId:centres[0].id,branchId:branches.find(b=>b.name===s.branch)!.id,guardian:'Not recorded',phone:'',createdAt:new Date().toISOString()}})
  return {version:1,centres,branches,students}
 }catch {throw Error('Legacy demo data cannot be imported. The original browser entries have been preserved.')}
}
