import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Holiday from "@/models/Holiday";
import User from "@/models/User";
import SystemLog from "@/models/SystemLog";
import { sendHolidayAnnouncementSMS } from "@/utils/sms";
import { createNotification } from "@/controllers/notificationController";

/**
 * Create a new holiday/event
 */
export const createHoliday = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { date, name, type, description, isRecurring, recurringMonth, recurringDay } = req.body;

    const holiday = new Holiday({
      _id: uuidv4(),
      companyId: req.user.companyId,
      date,
      name,
      type,
      description,
      isRecurring,
      recurringMonth,
      recurringDay,
    });

    await holiday.save();

    // Send notifications to all company staff
    const users = await User.find({
      companyId: req.user.companyId,
      role: { $in: ["employee", "hr_manager", "admin_staff"] },
    });

    let smsSentCount = 0;
    for (const user of users) {
      if (user.phone && user.phoneVerified) {
        const sent = await sendHolidayAnnouncementSMS(user.phone, user.name, name, date);
        if (sent) {
          smsSentCount++;
        }
      }
    }

    // Create in-app notifications for all company users
    const notificationMessage = description || `No additional details provided.`;
    const notificationCount = await createNotification(
      req.user.companyId,
      "holiday",
      `New Holiday: ${name}`,
      `A new event has been announced for ${date}. ${notificationMessage}`,
      holiday._id
    );

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "HOLIDAY_CREATED",
      resource: "Holiday",
      description: `Created ${type} holiday: ${name} on ${date}. SMS sent to ${smsSentCount} staff members. Notifications sent to ${notificationCount} users.`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Holiday created successfully. SMS notification sent to ${smsSentCount} staff members. In-app notifications sent to ${notificationCount} users.`,
      data: holiday,
      smsSent: smsSentCount,
      notificationsSent: notificationCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get holidays for a specific month/year
 */
export const getHolidays = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { month, year } = req.query;

    let query: any = { companyId: req.user.companyId };

    if (month && year) {
      const monthStr = (parseInt(month as string)).toString().padStart(2, "0");
      const yearStr = year as string;
      const startDate = `${yearStr}-${monthStr}-01`;
      const daysInMonth = new Date(parseInt(yearStr), parseInt(month as string), 0).getDate();
      const endDate = `${yearStr}-${monthStr}-${daysInMonth.toString().padStart(2, "0")}`;
      
      // Get specific month holidays
      query.date = { $gte: startDate, $lte: endDate };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });

    // Also get recurring holidays for the month
    if (month && year) {
      const recurringHolidays = await Holiday.find({
        companyId: req.user.companyId,
        isRecurring: true,
        recurringMonth: parseInt(month as string),
      });

      // Generate dates for recurring holidays (keep original _id for updates)
      const recurringDates = recurringHolidays.map((h) => {
        const yearStr = year as string;
        const monthStr = (parseInt(month as string)).toString().padStart(2, "0");
        const dayStr = h.recurringDay?.toString().padStart(2, "0") || "01";
        return {
          ...h.toObject(),
          date: `${yearStr}-${monthStr}-${dayStr}`,
          // Keep original _id for backend updates, add displayId for UI reference
          originalId: h._id,
          isRecurringInstance: true,
        };
      });

      holidays.push(...recurringDates as any);
    }

    res.json({
      success: true,
      data: holidays,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a holiday
 */
export const updateHoliday = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { holidayId } = req.params;
    const updates = req.body;

    const holiday = await Holiday.findById(holidayId);
    if (!holiday || holiday.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    Object.assign(holiday, updates);
    await holiday.save();

    // Send notifications to all company staff about the update
    const users = await User.find({
      companyId: req.user.companyId,
      role: { $in: ["employee", "hr_manager", "admin_staff"] },
    });

    let smsSentCount = 0;
    for (const user of users) {
      if (user.phone && user.phoneVerified) {
        const sent = await sendHolidayAnnouncementSMS(
          user.phone,
          user.name,
          `${holiday.name} (Updated)`,
          holiday.date
        );
        if (sent) {
          smsSentCount++;
        }
      }
    }

    // Create in-app notifications for all company users about the update
    const notificationMessage = holiday.description || `Holiday details have been updated.`;
    const notificationCount = await createNotification(
      req.user.companyId,
      "holiday",
      `Updated: ${holiday.name}`,
      `The event scheduled for ${holiday.date} has been updated. ${notificationMessage}`,
      holiday._id
    );

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "HOLIDAY_UPDATED",
      resource: "Holiday",
      description: `Updated holiday: ${holiday.name}. SMS sent to ${smsSentCount} staff members. Notifications sent to ${notificationCount} users.`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Holiday updated successfully. SMS notification sent to ${smsSentCount} staff members. In-app notifications sent to ${notificationCount} users.`,
      data: holiday,
      smsSent: smsSentCount,
      notificationsSent: notificationCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a holiday
 */
export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { holidayId } = req.params;

    const holiday = await Holiday.findById(holidayId);
    if (!holiday || holiday.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    await Holiday.findByIdAndDelete(holidayId);

    await SystemLog.create({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action: "HOLIDAY_DELETED",
      resource: "Holiday",
      description: `Deleted holiday: ${holiday.name}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
