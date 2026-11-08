import { createContext, useContext } from 'react'
import type { PilotData, PilotSession } from './model'
import type { PilotRepository } from './repository'
export interface PilotContextValue {data:PilotData;session:PilotSession;repo:PilotRepository;reload:()=>Promise<void>;logout:()=>void}
export const PilotContext=createContext<PilotContextValue|undefined>(undefined)
export function usePilot(){const context=useContext(PilotContext);if(!context)throw Error('VCM workspace unavailable');return context}
