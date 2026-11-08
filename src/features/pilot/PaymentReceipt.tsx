import { GraduationCap } from 'lucide-react'
import { money } from '../../domain/operations'
import { due, nameOf } from './model'
import type { Collection, PilotData } from './model'

export function PaymentReceipt({ payment, data }: { payment: Collection; data: PilotData }) {
  const invoice = data.invoices.find(i => i.id === payment.invoiceId)
  if (!invoice) return <p role="alert">The invoice for this receipt could not be found.</p>
  const student = data.students.find(s => s.id === invoice.studentId)
  const batch = data.batches.find(b => b.id === invoice.classId)
  const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Colombo' })
    .format(new Date(`${payment.date}T12:00:00+05:30`))
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' })
    .format(new Date(`${invoice.month}-01T12:00:00+05:30`))

  return <article className={`vcm-receipt ${payment.voidedAt ? 'is-voided' : ''}`} aria-label={`Payment receipt ${payment.receipt}`}>
    <div className="vcm-receipt-accent" />
    <header className="vcm-receipt-header">
      <div className="vcm-receipt-centre">
        <span className="vcm-receipt-logo">{data.settings.logo
          ? <img src={data.settings.logo} alt="Centre logo" />
          : <GraduationCap size={28} />}</span>
        <div><h2>{data.settings.name}</h2><p>MATHEMATICS TUITION</p></div>
      </div>
      <div className="vcm-receipt-title"><h3>PAYMENT RECEIPT</h3><span className="vcm-receipt-state">{payment.voidedAt ? 'VOIDED' : 'PAYMENT RECORDED'}</span></div>
    </header>
    {(data.settings.address || data.settings.phone) && <div className="vcm-receipt-contact">{data.settings.address}{data.settings.phone && <span>Tel: {data.settings.phone}</span>}</div>}
    <div className="vcm-receipt-meta"><div><span>Receipt number</span><strong>{payment.receipt}</strong></div><div><span>Payment date</span><strong>{date}</strong></div><div><span>Payment method</span><strong>{payment.method}</strong></div></div>
    <section className="vcm-receipt-student"><div><span>RECEIVED FROM</span><h4>{student?.name || 'Student'}</h4><p>{student?.number} · {student?.grade}</p></div><div><span>BILLING PERIOD</span><strong>{month}</strong><p>{batch?.name}</p></div></section>
    <div className="vcm-receipt-payment"><div><span>AMOUNT RECEIVED</span><strong>{money(payment.amountCents)}</strong></div><span className="vcm-receipt-method">{payment.method}</span></div>
    <div className="vcm-receipt-breakdown"><div><span>Description</span><span>Amount</span></div><div><strong>Monthly mathematics tuition</strong><strong>{money(invoice.amountCents)}</strong></div>{invoice.discountCents > 0 && <div><span>Approved discount / waiver</span><span>− {money(invoice.discountCents)}</span></div>}<div className="vcm-receipt-net"><span>Net monthly fee</span><strong>{money(invoice.amountCents - invoice.discountCents)}</strong></div></div>
    <div className="vcm-receipt-balance"><span>Current outstanding balance</span><strong>{money(due(data, invoice))}</strong></div>
    <p className="vcm-receipt-balance-note">Balance and fee adjustments reflect the latest account records.</p>
    {payment.note && <div className="vcm-receipt-note"><span>Payment note</span><p>{payment.note}</p></div>}
    {payment.voidedAt && <div className="vcm-receipt-void"><strong>This payment has been voided.</strong><p>{payment.voidReason}</p><p>Voided by {nameOf(data, payment.voidedBy || '')}</p></div>}
    <div className="vcm-receipt-signoff"><div><span>RECORDED BY</span><strong>{nameOf(data, payment.recordedBy)}</strong></div><div><strong>Thank you for your payment.</strong><span>Please keep this receipt for your records.</span></div></div>
    <footer><span>{data.settings.name} · Payment acknowledgement</span><span>DEMO COPY</span></footer>
  </article>
}
