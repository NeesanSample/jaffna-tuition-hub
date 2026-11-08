import { useEffect, useRef, useState } from 'react'
import { UserRound } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { readStudentPhoto } from './studentPhoto'

export function StudentPhotoField({ photo, onChange, onBusyChange }: {
  photo: string; onChange: (photo: string) => void; onBusyChange: (busy: boolean) => void
}) {
  const alive = useRef(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  return <div className="vcm-photo-field full-width">
    <div className="vcm-photo-field-preview">{photo
      ? <img src={photo} alt="Student photo preview" />
      : <UserRound size={38} strokeWidth={1.4} />}</div>
    <div><label>Student photo (optional)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async event => {
      const file = event.currentTarget.files?.[0]
      event.currentTarget.value = ''
      if (!file) return
      setBusy(true); onBusyChange(true); setError('')
      try {
        const next = await readStudentPhoto(file)
        if (alive.current) onChange(next)
      } catch (error) {
        if (alive.current) setError((error as Error).message)
      } finally {
        if (alive.current) { setBusy(false); onBusyChange(false) }
      }
    }} /></label><small>JPG, PNG or WebP. Your photo appears on the ID card next to the QR code.</small>
    {busy && <p role="status">Preparing photo…</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    {photo && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { onChange(''); setError('') }}>Remove photo</Button>}
    </div>
  </div>
}
