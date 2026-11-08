import { useCallback, useEffect, useState } from 'react'
import type { Session } from '../domain/entities'
import type { Operations } from '../domain/operations'
import { operationsRepository } from '../repositories/operationsRepository'
export function useOperations(session:Session){const [data,setData]=useState<Operations>();const [error,setError]=useState('');const reload=useCallback(async()=>{const next=await operationsRepository.snapshot(session);setData(next);setError('')},[session]);useEffect(()=>{let live=true;operationsRepository.snapshot(session).then(d=>{if(live)setData(d)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[session]);return {data,error,reload,retry:()=>{void reload().catch(e=>setError(e.message))}}}

