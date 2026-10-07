'use client'

import { createContext, useContext } from 'react'

const PublicBaseContext = createContext('')

export function PublicBaseProvider({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  return <PublicBaseContext.Provider value={value}>{children}</PublicBaseContext.Provider>
}

/** Site-relative media (e.g. /demo/…) lives on the public app: prefix it. */
export function useMediaUrl() {
  const base = useContext(PublicBaseContext)
  return (url: string | undefined) =>
    url ? (url.startsWith('/') ? `${base}${url}` : url) : undefined
}
