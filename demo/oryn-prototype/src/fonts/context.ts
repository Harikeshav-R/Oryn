import { createContext, useContext } from 'react'
import { LOADING_REPORT, type FontReport } from './faces'

export const FontContext = createContext<FontReport>(LOADING_REPORT)

export function useFontReport(): FontReport {
  return useContext(FontContext)
}
