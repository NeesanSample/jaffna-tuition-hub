import { QRCodeSVG } from 'qrcode.react'
import { GraduationCap, UserRound } from 'lucide-react'
import type { PilotData, PilotStudent } from './model'

export function StudentCard({ student, data }: { student: PilotStudent; data: PilotData }) {
  const classes = data.enrolments
    .filter(e => e.studentId === student.id && !e.endedOn)
    .map(e => data.batches.find(b => b.id === e.classId)?.name)
    .filter(Boolean)

  return <article className="vcm-student-card" aria-label={`Student identity card for ${student.name}`}>
    <header className="vcm-card-header">
      <span className="vcm-card-logo">{data.settings.logo
        ? <img src={data.settings.logo} alt="Centre logo" />
        : <GraduationCap size={25} />}</span>
      <div><strong>{data.settings.name}</strong><span>{data.settings.cardNote}</span></div>
    </header>
    <div className="vcm-card-body">
      <div className="vcm-card-label">STUDENT IDENTITY CARD</div>
      <div className="vcm-card-identity">
        <div className="vcm-card-photo">{student.photo
          ? <img src={student.photo} alt={`Photo of ${student.name}`} />
          : <div className="vcm-card-photo-placeholder"><UserRound size={46} strokeWidth={1.3} /><span>Student photo</span></div>}</div>
        <div className="vcm-card-qr" role="img" aria-label={`Attendance QR code for ${student.name}`}>
          <QRCodeSVG value={`vcm:${student.qrToken}`} size={148} marginSize={4} bgColor="#ffffff" fgColor="#111827" />
          <small>SCAN FOR ATTENDANCE</small>
        </div>
      </div>
      <h2>{student.name}</h2>
      <p className="vcm-card-number">{student.number}</p>
      <div className="vcm-card-class"><span>{student.grade}</span><span>{classes.join(' · ') || 'Mathematics'}</span></div>
    </div>
    <footer>Keep this card with you for every class.</footer>
  </article>
}
