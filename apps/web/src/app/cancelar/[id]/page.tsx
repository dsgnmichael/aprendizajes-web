export const instant = false

import { CancelConfirmation } from '@/components/parent-club/CancelConfirmation'

export default async function CancelarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <main className="min-h-screen bg-canvas py-16 px-4">
      <div className="mx-auto max-w-md">
        <CancelConfirmation id={id} />
      </div>
    </main>
  )
}
