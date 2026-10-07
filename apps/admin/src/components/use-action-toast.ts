'use client'

import { toast } from '@repo/ui/components/sonner'
import type { ActionResult } from '@/lib/action'

/** Shows the standard toast for an action result and returns its data (or null). */
export function handleResult<T>(result: ActionResult<T>, success?: string): T | null {
  if (!result.ok) {
    toast.error(result.error)
    return null
  }
  if (result.warning) toast.warning(result.warning)
  else if (success) toast.success(success)
  return result.data
}
