import cron from "node-cron";
import connection from "../config/db";
import { sendReturnReminderEmail } from "../utils/emailTemplates";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

export const startBorrowReminderJob = () => {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log(
        `[CRON] ${new Date().toISOString()} - Running borrow reminder job...`
      );

      try {
        const query = `
          SELECT 
            b.id,
            b.user_id,
            b.due_date,
            u.full_name,
            u.email,
            GROUP_CONCAT(DISTINCT bk.title SEPARATOR ', ') as book_titles
          FROM borrows b
          JOIN users u ON u.id = b.user_id
          LEFT JOIN borrow_details bd ON bd.borrow_id = b.id
          LEFT JOIN book_copies bc ON bc.id = bd.copy_id
          LEFT JOIN books bk ON bk.id = bc.book_id
          WHERE b.status = 'ACTIVE'
            AND (DATE(b.due_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              OR DATE(b.due_date) = DATE_ADD(CURDATE(), INTERVAL 2 DAY))
          GROUP BY b.id
        `;

        const [results] = await connection.query(query);
        const borrows = results as Array<{
          id: number;
          user_id: string;
          due_date: string;
          full_name: string;
          email: string;
          book_titles: string;
        }>;

        if (borrows.length === 0) {
          console.log("[CRON] No borrows due soon. No emails sent.");
          return;
        }

        console.log(
          `[CRON] Found ${borrows.length} borrow(s) due soon. Sending emails...`
        );

        for (const borrow of borrows) {
          try {
            const dueDate = format(new Date(borrow.due_date), "dd/MM/yyyy", {
              locale: vi,
            });
            const daysLeft = differenceInDays(
              new Date(borrow.due_date),
              new Date()
            );

            await sendReturnReminderEmail(
              borrow.email,
              borrow.full_name,
              borrow.book_titles,
              dueDate,
              daysLeft
            );

            console.log(
              `[CRON] Sent reminder email to ${borrow.email} for borrow #${borrow.id}`
            );
          } catch (emailError: any) {
            console.error(
              `[CRON] Failed to send email to ${borrow.email}:`,
              emailError.message
            );
          }
        }

        console.log(
          `[CRON] Borrow reminder job completed. Sent ${borrows.length} email(s).`
        );
      } catch (error: any) {
        console.error("[CRON] Error in borrow reminder job:", error);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );

  console.log(
    "[CRON] Borrow reminder job scheduled: Daily at 8:00 AM (Asia/Ho_Chi_Minh)"
  );
};
