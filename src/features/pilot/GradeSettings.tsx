import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/shared/Primitives'
import { usePilot } from './context'
import { gradeSetup } from './model'
import { Table } from './shared'
import { useAction } from './useAction'

export function GradeSettings() {
  const { data, session, repo, reload } = usePilot()
  const [grades, setGrades] = useState(() => gradeSetup(data).map(g => ({ ...g })))
  const [adding, setAdding] = useState('')
  const [removing, setRemoving] = useState('')
  const action = useAction()
  const available = Array.from({ length: 13 }, (_, i) => `Grade ${i + 1}`).filter(name => !grades.some(g => g.name === name))
  const newGrade = available.includes(adding) ? adding : available[0] || ''
  const changed = JSON.stringify(grades) !== JSON.stringify(gradeSetup(data))

  return <article>
    <div className="panel-heading"><div><h2>Grades & classes</h2><p>One class per grade, unless you choose multiple batches.</p></div></div>
    {action.feedback}
    <fieldset disabled={action.busy}>
      <Table headers={['Grade', 'Class setup', 'Classes', '']}>
        {grades.map(grade => <tr key={grade.name}>
          <td><strong>{grade.name}</strong></td>
          <td><label><span className="sr-only">Class setup for {grade.name}</span><select value={grade.multipleBatches ? 'multiple' : 'single'} onChange={event => setGrades(values => values.map(g => g.name === grade.name ? { ...g, multipleBatches: event.target.value === 'multiple' } : g))}>
            <option value="single">One class</option><option value="multiple">Multiple batches (A, B…)</option>
          </select></label></td>
          <td><Link to={`/batches?grade=${encodeURIComponent(grade.name)}`}>Edit classes & times</Link></td>
          <td><Button type="button" size="sm" variant="outline" disabled={grades.length === 1} onClick={() => setRemoving(grade.name)}>Remove</Button></td>
        </tr>)}
      </Table>
      <div className="grade-settings-add"><label>Add a grade<select value={newGrade} onChange={event => setAdding(event.target.value)} disabled={!available.length}>{available.map(name => <option key={name}>{name}</option>)}</select></label>
        <Button type="button" variant="outline" disabled={!newGrade} onClick={() => setGrades(values => [...values, { name: newGrade, multipleBatches: false }].sort((a, b) => Number(a.name.slice(6)) - Number(b.name.slice(6))))}>Add grade</Button>
      </div>
      <p className="helper-note">Saving a new grade creates one class, such as G12. Set its monthly fee and weekly times in Batches. Enable multiple batches only if you need separate groups.</p>
      <div className="dialog-actions"><Button type="button" variant="outline" disabled={!changed} onClick={() => setGrades(gradeSetup(data).map(g => ({ ...g })))}>Discard changes</Button><Button type="button" disabled={!changed} onClick={() => { void action.act(async () => { await repo.saveGrades(session, grades); await reload() }, 'Grade settings saved.') }}>{action.busy ? 'Saving…' : 'Save grades'}</Button></div>
    </fieldset>
    {removing && <Dialog title={`Remove ${removing}?`} description="Existing attendance and fee history will be retained. Move or deactivate any active students first. Classes with history must be made inactive before removing their grade." onClose={() => setRemoving('')}><div className="dialog-actions"><Button variant="outline" onClick={() => setRemoving('')}>Keep grade</Button><Button variant="destructive" onClick={() => { setGrades(values => values.filter(g => g.name !== removing)); setRemoving('') }}>Remove from setup</Button></div></Dialog>}
  </article>
}
