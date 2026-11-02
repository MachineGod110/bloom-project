import cron from "node-cron";
import User from "../models/User.js";

// Runs once a day. In a real deployment this is where you'd trigger an
// email/push notification for anyone whose nextReminder has arrived.
export function startReminderJob() {
  cron.schedule("0 9 * * *", async () => {
    const dueUsers = await User.find({ nextReminder: { $lte: new Date() } });
    for (const user of dueUsers) {
      console.log(`Reminder due for ${user.email} — wire up email/push here.`);
      // e.g. await sendReminderEmail(user.email, user.name);
    }
  });
  console.log("Reminder cron job scheduled (daily at 09:00 server time).");
}
