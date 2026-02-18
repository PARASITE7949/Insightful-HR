import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are set
let twilioClient: any = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send OTP via SMS to a phone number
 * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @param otp - OTP code to send
 * @returns boolean - true if sent successfully
 */
export async function sendOTPViaSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    // Fallback to console if Twilio not configured
    if (!twilioClient) {
      console.log(`[SMS] OTP for ${phoneNumber}: ${otp}`);
      return true;
    }

    const message = await twilioClient.messages.create({
      body: `Your Insightful HR OTP is: ${otp}. This code expires in 5 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`OTP sent via SMS: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

/**
 * Send monthly appraisal notification via SMS
 * @param phoneNumber - Phone number in E.164 format
 * @param employeeName - Name of the employee
 * @param month - Month name
 * @param year - Year
 * @param overallScore - Performance score
 * @returns boolean - true if sent successfully
 */
export async function sendMonthlyAppraisalSMS(
  phoneNumber: string,
  employeeName: string,
  month: string,
  year: number,
  overallScore: number
): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log(
        `[SMS] Monthly Appraisal for ${employeeName} (${phoneNumber}): ${month} ${year} - Score: ${overallScore}%`
      );
      return true;
    }

    const message = await twilioClient.messages.create({
      body: `Hi ${employeeName}, Your monthly appraisal for ${month} ${year} has been generated. Overall Score: ${overallScore}%. Please log in to Insightful HR to view detailed feedback.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`Monthly appraisal SMS sent: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error("Error sending monthly appraisal SMS:", error);
    return false;
  }
}

/**
 * Send appraisal reminder SMS to HR managers
 * @param phoneNumber - Phone number in E.164 format
 * @param hrName - Name of HR manager
 * @param pendingCount - Number of pending appraisals
 * @returns boolean - true if sent successfully
 */
export async function sendAppraisalReminderSMS(
  phoneNumber: string,
  hrName: string,
  pendingCount: number
): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log(
        `[SMS] Appraisal Reminder for ${hrName} (${phoneNumber}): ${pendingCount} pending appraisals`
      );
      return true;
    }

    const message = await twilioClient.messages.create({
      body: `Hi ${hrName}, You have ${pendingCount} pending appraisal(s) to review in Insightful HR. Please visit the HR dashboard to proceed.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`Appraisal reminder SMS sent: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error("Error sending appraisal reminder SMS:", error);
    return false;
  }
}

/**
 * Send daily report notification SMS
 * @param phoneNumber - Phone number in E.164 format
 * @param recipientName - Name of person receiving the notification
 * @param senderName - Name of person submitting/responding on report
 * @param summary - Report summary or response message
 * @returns boolean - true if sent successfully
 */
export async function sendDailyReportSMS(
  phoneNumber: string,
  recipientName: string,
  senderName: string,
  summary: string
): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log(`[SMS] Daily Report for ${recipientName} from ${senderName}: ${summary}`);
      return true;
    }

    const message = await twilioClient.messages.create({
      body: `Hi ${recipientName}, ${summary}`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`Daily report SMS sent: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error("Error sending daily report SMS:", error);
    return false;
  }
}

/**
 * Send holiday announcement SMS to all staff
 * @param phoneNumber - Phone number in E.164 format
 * @param staffName - Name of staff member
 * @param holidayName - Name of the holiday
 * @param holidayDate - Date of the holiday
 * @returns boolean - true if sent successfully
 */
export async function sendHolidayAnnouncementSMS(
  phoneNumber: string,
  staffName: string,
  holidayName: string,
  holidayDate: string
): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log(
        `[SMS] Holiday Announcement for ${staffName} (${phoneNumber}): ${holidayName} on ${holidayDate}`
      );
      return true;
    }

    const message = await twilioClient.messages.create({
      body: `Hi ${staffName}, A new holiday/event has been announced: "${holidayName}" on ${holidayDate}. Please check the HR portal for more details.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`Holiday announcement SMS sent: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error("Error sending holiday announcement SMS:", error);
    return false;
  }
}

/**
 * Verify if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  return !!twilioClient;
}
