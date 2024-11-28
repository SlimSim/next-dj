'use client'

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/store'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    usePlayerStore.persist.rehydrate()
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return null
  }

  return <>{children}</>
}
