import { collections } from '@repo/database'

export async function getDashboardStats() {
  const c = await collections()
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const [byStatus, newAppointments, weekAppointments, testimonials, pendingChanges, recentAppointments, recentActivity] =
    await Promise.all([
      c.professionals.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
      c.appointmentRequests.countDocuments({ status: 'new' }),
      c.appointmentRequests.countDocuments({ createdAt: { $gte: weekAgo } }),
      c.testimonials.countDocuments({ enabled: true }),
      c.professionals.countDocuments({ status: 'published', $expr: { $gt: ['$revision', '$publishedRevision'] } }),
      c.appointmentRequests
        .find({}, { projection: { firstName: 1, lastName: 1, professionalName: 1, status: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      c.auditLogs.find({}).sort({ timestamp: -1 }).limit(8).toArray(),
    ])
  const status = Object.fromEntries(byStatus.map((r) => [r._id, r.count])) as Record<string, number>
  return {
    professionals: {
      published: status.published ?? 0,
      draft: status.draft ?? 0,
      archived: status.archived ?? 0,
      pendingChanges,
    },
    appointments: { new: newAppointments, lastWeek: weekAppointments },
    testimonials,
    recentAppointments: recentAppointments.map((a) => ({
      id: a._id.toHexString(),
      name: `${a.firstName} ${a.lastName}`.trim(),
      professionalName: a.professionalName,
      status: a.status,
      createdAt: a.createdAt,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a._id.toHexString(),
      action: a.action,
      actor: a.actor.email,
      entityType: a.entityType,
      timestamp: a.timestamp,
    })),
  }
}
