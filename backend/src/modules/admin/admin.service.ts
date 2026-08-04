import { User } from '../users/user.model'
import { Breeder } from '../breeders/breeder.model'
import { Listing } from '../listings/listing.model'
import { DocumentModel } from '../documents/document.model'
import { Inquiry } from '../inquiries/inquiry.model'
import { Review } from '../reviews/review.model'

class AdminService {
  /**
   * Статистика платформы для админ-панели — агрегации без новых коллекций
   */
  async getStats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      usersByRole,
      blockedUsers,
      newUsersLast7Days,
      listingsByStatus,
      publicListings,
      pendingModerationListings,
      pendingBreeders,
      verifiedBreeders,
      pendingDocuments,
      inquiriesTotal,
      purchasesConfirmed,
      reviewsAgg,
    ] = await Promise.all([
      User.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Listing.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Listing.countDocuments({ status: 'active', verificationStatus: 'verified' }),
      Listing.countDocuments({ status: 'pending', verificationStatus: 'pending' }),
      Breeder.countDocuments({ 'verification.status': 'pending' }),
      Breeder.countDocuments({ 'verification.status': 'verified' }),
      DocumentModel.countDocuments({ status: 'pending' }),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'purchase_confirmed' }),
      Review.aggregate<{ _id: null; count: number; avgRating: number }>([
        { $group: { _id: null, count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      ]),
    ])

    const byRole: Record<string, number> = { user: 0, breeder: 0, admin: 0 }
    usersByRole.forEach((r) => {
      byRole[r._id] = r.count
    })

    const byStatus: Record<string, number> = {}
    let listingsTotal = 0
    listingsByStatus.forEach((s) => {
      byStatus[s._id] = s.count
      listingsTotal += s.count
    })

    const reviews = reviewsAgg[0]

    return {
      users: {
        total: byRole.user + byRole.breeder + byRole.admin,
        byRole,
        blocked: blockedUsers,
        newLast7Days: newUsersLast7Days,
      },
      listings: {
        total: listingsTotal,
        byStatus,
        publiclyVisible: publicListings,
      },
      breeders: {
        pending: pendingBreeders,
        verified: verifiedBreeders,
      },
      moderationQueue: {
        listings: pendingModerationListings,
        breeders: pendingBreeders,
        documents: pendingDocuments,
      },
      inquiries: {
        total: inquiriesTotal,
        purchasesConfirmed,
      },
      reviews: {
        total: reviews?.count ?? 0,
        avgRating: reviews?.avgRating ? Math.round(reviews.avgRating * 10) / 10 : null,
      },
    }
  }
}

export const adminService = new AdminService()
