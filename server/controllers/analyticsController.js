const Application = require("../models/Application");
const Interview = require("../models/Interview");
const SavedJob = require("../models/SavedJob");
const AppError = require("../utils/appError");

const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const todayKey = now.toISOString().slice(0, 10);
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + index, 1));
      return {
        key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
        month: date.toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
      };
    });

    const [applicationFacets, interviewGroups, savedJobGroups] = await Promise.all([
      Application.aggregate([
        { $match: { user: req.user._id } },
        {
          $facet: {
            overview: [
              {
                $group: {
                  _id: null,
                  totalApplications: { $sum: 1 },
                  totalOffers: { $sum: { $cond: [{ $eq: ["$status", "Offer"] }, 1, 0] } },
                  totalRejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
                },
              },
            ],
            applicationsByStatus: [
              { $group: { _id: "$status", count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            applicationsByJobType: [
              { $group: { _id: "$jobType", count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            applicationsByWorkMode: [
              { $group: { _id: "$workMode", count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            applicationsOverTime: [
              { $match: { applicationDate: { $gte: firstMonth, $lt: nextMonth } } },
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m", date: "$applicationDate", timezone: "UTC" } },
                  count: { $sum: 1 },
                },
              },
            ],
            followUps: [
              { $match: { followUpDate: { $type: "date" } } },
              {
                $addFields: {
                  followUpStatusForAnalytics: { $ifNull: ["$followUpStatus", "Pending"] },
                  followUpDateKey: { $dateToString: { format: "%Y-%m-%d", date: "$followUpDate", timezone: "UTC" } },
                },
              },
              {
                $group: {
                  _id: null,
                  pending: { $sum: { $cond: [{ $eq: ["$followUpStatusForAnalytics", "Pending"] }, 1, 0] } },
                  completed: { $sum: { $cond: [{ $eq: ["$followUpStatusForAnalytics", "Completed"] }, 1, 0] } },
                  overdue: {
                    $sum: {
                      $cond: [
                        { $and: [{ $eq: ["$followUpStatusForAnalytics", "Pending"] }, { $lt: ["$followUpDateKey", todayKey] }] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            recentApplications: [
              { $sort: { applicationDate: -1, createdAt: -1 } },
              { $limit: 5 },
              { $project: { _id: 1, companyName: 1, jobTitle: 1, status: 1, applicationDate: 1 } },
            ],
            upcomingFollowUps: [
              {
                $match: {
                  followUpDate: { $type: "date" },
                  followUpStatus: { $ne: "Completed" },
                },
              },
              { $sort: { followUpDate: 1, companyName: 1 } },
              { $limit: 5 },
              { $project: { _id: 1, companyName: 1, jobTitle: 1, status: 1, followUpDate: 1, followUpStatus: 1 } },
            ],
          },
        },
      ]),
      Interview.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SavedJob.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            converted: { $sum: { $cond: ["$isConverted", 1, 0] } },
            notConverted: { $sum: { $cond: ["$isConverted", 0, 1] } },
          },
        },
      ]),
    ]);

    const analytics = applicationFacets[0] || {};
    const applicationOverview = analytics.overview?.[0] || {};
    const followUps = analytics.followUps?.[0] || { pending: 0, completed: 0, overdue: 0 };
    const savedJobs = savedJobGroups[0] || { total: 0, converted: 0, notConverted: 0 };
    const totalInterviews = interviewGroups.reduce((total, item) => total + item.count, 0);
    const applicationsOverTimeCounts = new Map((analytics.applicationsOverTime || []).map((item) => [item._id, item.count]));

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalApplications: applicationOverview.totalApplications || 0,
          totalInterviews,
          totalOffers: applicationOverview.totalOffers || 0,
          totalRejected: applicationOverview.totalRejected || 0,
          totalSavedJobs: savedJobs.total || 0,
          pendingFollowUps: followUps.pending || 0,
        },
        applicationsByStatus: (analytics.applicationsByStatus || []).map(({ _id, count }) => ({ status: _id, count })),
        applicationsByJobType: (analytics.applicationsByJobType || []).map(({ _id, count }) => ({ jobType: _id, count })),
        applicationsByWorkMode: (analytics.applicationsByWorkMode || []).map(({ _id, count }) => ({ workMode: _id, count })),
        applicationsOverTime: months.map(({ key, month }) => ({ month, year: Number(key.slice(0, 4)), count: applicationsOverTimeCounts.get(key) || 0 })),
        interviewsByStatus: interviewGroups.map(({ _id, count }) => ({ status: _id, count })),
        followUps: {
          pending: followUps.pending || 0,
          completed: followUps.completed || 0,
          overdue: followUps.overdue || 0,
        },
        savedJobs: {
          total: savedJobs.total || 0,
          converted: savedJobs.converted || 0,
          notConverted: savedJobs.notConverted || 0,
        },
        recentApplications: analytics.recentApplications || [],
        upcomingFollowUps: analytics.upcomingFollowUps || [],
      },
    });
  } catch (error) {
    return next(new AppError("Unable to load analytics", 500));
  }
};

module.exports = { getAnalytics };
