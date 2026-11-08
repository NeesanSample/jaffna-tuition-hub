import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { usePilot } from './context'
export function Header({title,description,children}:{title:string;description?:string;children?:ReactNode}){const {data}=usePilot();return <div className="page-header"><div><div className="eyebrow">{data.settings.name}{data.settings.cardNote.trim()&&<> · {data.settings.cardNote.trim()}</>}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div><div className="inline-actions">{children}</div></div>}
export function ActionLink({to,children}:{to:string;children:ReactNode}){return <Button asChild variant="outline"><Link to={to}>{children}</Link></Button>}
export function Table({headers,children}:{headers:string[];children:ReactNode}){return <div className="table-scroll" tabIndex={0} role="region" aria-label={headers.join(', ')}><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}
