// The yearly reminders (utils/reminders.js) emailed to the site's admins by the nightly job: each
// one due, once a calendar year (the year in its audit-log entry), so it isn't sent again. Never throws:
// the job's own work and reply go on whatever happens here. Returns how many were sent.
import { createAppEvent } from '../../event/events.js';
import { DOMAINS } from '../../utils/responses/responses.js';
import { dueReminders, reminderAction } from '../../utils/reminders.js';
import { findAlertRecipients, findReminderSentFor } from '../../domain/admin.js';
import { sendAlertEmail } from '../email/emailHandler.js';
import { FRONTEND_ORIGINS } from '../../utils/config.js';
import { BusinessName, FrontendUrl, LogoUrl } from '../../utils/constants/siteConstants.js';

const siteOrigin = () => FRONTEND_ORIGINS[0] ?? FrontendUrl;

export async function sendDueReminders(now = new Date()) {
  let sent = 0;
  for (const reminder of dueReminders(now)) {
    const action = reminderAction(reminder.key);
    try {
      if (await findReminderSentFor(action, now.getUTCFullYear())) continue;
      const recipients = await findAlertRecipients();
      const context = {
        title: reminder.title,
        reminderTitle: reminder.title,
        text: reminder.text,
        adminUrl: `${siteOrigin()}/admin`,
        businessName: BusinessName,
        logoUrl: LogoUrl,
        year: now.getUTCFullYear(),
      };
      await Promise.all(recipients.map((to) => sendAlertEmail(to, `${BusinessName}: ${reminder.title.toLowerCase()}`, 'reminderEmail', context)));
      await createAppEvent({
        level: 'INFO',
        domain: DOMAINS.cron,
        action,
        message: `Reminder emailed: ${reminder.title}`,
        statusCode: 200,
        metadata: { key: reminder.key, year: now.getUTCFullYear(), recipients: recipients.length },
      });
      sent += 1;
    } catch (err) {
      console.error(`[reminders] ${reminder.key} not sent:`, err);
    }
  }
  return sent;
}
