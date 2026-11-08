import { GraduationCap } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { Snapshot, Student } from '../../domain/entities'
import { Avatar } from './Primitives'
export function StudentIdentityCard({student,data}:{student:Student;data:Snapshot}){return <article className="identity-card"><div className="id-brand"><GraduationCap size={25}/><span>Jaffna Tuition Hub<small>STUDENT IDENTITY CARD</small></span></div><div className="id-person"><Avatar name={student.name} large/><h2>{student.name}</h2><p>{student.grade}</p></div><div className="id-location"><strong>{data.centres.find(c=>c.id===student.centreId)?.name}</strong><span>{data.branches.find(b=>b.id===student.branchId)?.name}</span></div><div className="qr-wrap" role="img" aria-label={`QR identity references for ${student.name}`}><QRCodeSVG value={JSON.stringify({version:1,studentId:student.id,centreId:student.centreId,branchId:student.branchId})} size={144} marginSize={3} bgColor="#ffffff" fgColor="#0f172a"/></div><p className="id-number">{student.id}</p><div className="id-footer">Registered {new Date(student.createdAt).toLocaleDateString('en-GB')}<span>LEARN · GROW · BELONG</span></div></article>}

