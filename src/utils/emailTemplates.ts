import { sendMail } from "./mailer.ts";

// hàm gửi mail chào mừng khi đăng ký thành công
export const sendWelcomeEmail = async (
  to: string,
  userName: string
): Promise<void> => {
  const subject = "Chào mừng đến với Thư viện HBH";
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 32px;">
      <h2 style="color: #4F46E5; text-align: center;">🎉 Chào mừng bạn 🎉</h2>
      <p style="font-size: 16px; color: #334155;">Xin chào <b>${userName}</b>,</p>
      <p style="color: #475569; line-height: 1.6;">
        Tài khoản của bạn đã được tạo thành công!<br/>
        Bạn có thể bắt đầu khám phá thư viện và mượn sách ngay bây giờ.
      </p>
      <p style="color: #475569; line-height: 1.6;">
        Chúc bạn có trải nghiệm tuyệt vời với Thư viện HBH!
      </p>
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      © 2025 HBH Library System. All rights reserved.
    </p>
  </div>
  `;

  await sendMail(to, subject, html, "welcome");
};

// hàm gửi mail đặt lại mật khẩu
export const sendPasswordResetEmail = async (
  to: string,
  userName: string,
  resetLink: string
): Promise<void> => {
  const subject = "Đặt lại mật khẩu - Thư viện HBH";
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 32px;">
      <h2 style="color: #4F46E5; text-align: center;">Đặt lại mật khẩu</h2>
      <p style="font-size: 16px; color: #334155;">Xin chào <b>${userName}</b>,</p>
      <p style="color: #475569; line-height: 1.6;">
        Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.<br/>
        Nhấn vào nút bên dưới để đặt lại mật khẩu mới:
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" 
           style="display: inline-block; background: #4F46E5; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Đặt lại mật khẩu
        </a>
      </div>

      <p style="font-size: 14px; color: #64748B;">
        Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.<br/>
        Liên kết sẽ hết hạn sau <b>15 phút</b>.
      </p>
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      © 2025 HBH Library System. All rights reserved.
    </p>
  </div>
  `;

  await sendMail(to, subject, html, "password-reset");
};

// hàm gửi email nếu thông báo mượn thành công
export const sendBorrowConfirmationEmail = async (
  to: string,
  userName: string,
  bookTitle: string,
  dueDate: string
): Promise<void> => {
  const subject = "Xác nhận mượn sách - Thư viện HBH";
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 32px;">
      <h2 style="color: #4F46E5; text-align: center;">Xác nhận mượn sách</h2>
      <p style="font-size: 16px; color: #334155;">Xin chào <b>${userName}</b>,</p>
      <p style="color: #475569; line-height: 1.6;">
        Bạn đã mượn thành công cuốn sách:<br/>
        <b style="color: #4F46E5;">${bookTitle}</b>
      </p>
      <p style="color: #475569; line-height: 1.6;">
        Ngày trả dự kiến: <b>${dueDate}</b>
      </p>
      <p style="font-size: 14px; color: #64748B;">
        Vui lòng trả sách đúng hạn để tránh phạt.
      </p>
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      © 2025 HBH Library System. All rights reserved.
    </p>
  </div>
  `;

  // gửi mail
  await sendMail(to, subject, html, "borrow-confirmation");
};

// hàm nhắc trả sách
export const sendReturnReminderEmail = async (
  to: string,
  userName: string,
  bookTitle: string,
  dueDate: string,
  daysLeft: number
): Promise<void> => {
  const subject = "Nhắc nhở trả sách - Thư viện HBH";
  const urgencyColor = daysLeft <= 2 ? "#EF4444" : "#F59E0B";
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 32px;">
      <h2 style="color: ${urgencyColor}; text-align: center;">Nhắc nhở trả sách</h2>
      <p style="font-size: 16px; color: #334155;">Xin chào <b>${userName}</b>,</p>
      <p style="color: #475569; line-height: 1.6;">
        Cuốn sách <b style="color: #4F46E5;">${bookTitle}</b> sắp đến hạn trả.
      </p>
      <p style="color: ${urgencyColor}; line-height: 1.6; font-weight: 600;">
        Còn <b>${daysLeft}</b> ngày nữa (${dueDate})
      </p>
      <p style="font-size: 14px; color: #64748B;">
        Vui lòng trả sách đúng hạn để tránh bị phạt.
      </p>
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      © 2025 HBH Library System. All rights reserved.
    </p>
  </div>
  `;

  await sendMail(to, subject, html, "return-reminder");
};

// hàm gửi email khi mượn quá hạn
export const sendOverdueNotificationEmail = async (
  to: string,
  userName: string,
  bookTitle: string,
  daysOverdue: number,
  fine: number
): Promise<void> => {
  const subject = "Thông báo quá hạn trả sách - Thư viện HBH";
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 32px;">
      <h2 style="color: #EF4444; text-align: center;">Thông báo quá hạn</h2>
      <p style="font-size: 16px; color: #334155;">Xin chào <b>${userName}</b>,</p>
      <p style="color: #475569; line-height: 1.6;">
        Cuốn sách <b style="color: #4F46E5;">${bookTitle}</b> đã quá hạn trả.
      </p>
      <p style="color: #EF4444; line-height: 1.6; font-weight: 600;">
        Quá hạn: <b>${daysOverdue}</b> ngày<br/>
        Phí phạt: <b>${fine.toLocaleString("vi-VN")} VNĐ</b>
      </p>
      <p style="font-size: 14px; color: #64748B;">
        Vui lòng trả sách ngay để tránh phí phạt tăng thêm.
      </p>
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      © 2025 HBH Library System. All rights reserved.
    </p>
  </div>
  `;

  await sendMail(to, subject, html, "overdue-notification");
};

// hàm gửi email khi tài khoản bị khoá
// export const sendAccountSuspendedEmail = async (
//   to: string,
//   userName: string,
//   reason: string
// ): Promise<void> => {
//   const subject = "Thông báo tài khoản bị khóa - Thư viện HBH";
//   const html = `
//   <div style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px;">
//     <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 32px;">
//       <h2 style="color: #EF4444; text-align: center;">Tài khoản bị khóa</h2>
//       <p style="font-size: 16px; color: #334155;">Xin chào <b>${userName}</b>,</p>
//       <p style="color: #475569; line-height: 1.6;">
//         Tài khoản của bạn đã bị khóa.<br/>
//         Lý do: <b>${reason}</b>
//       </p>
//       <p style="font-size: 14px; color: #64748B;">
//         Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.
//       </p>
//     </div>
//     <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
//       © 2025 HBH Library System. All rights reserved.
//     </p>
//   </div>
//   `;

//   await sendMail(to, subject, html, "account-suspended");
// };

export const sendChangePasswordOtpEmail = async (
  to: string,
  userName: string,
  code: string
): Promise<void> => {
  const subject = "Mã xác minh thay đổi mật khẩu - UNETI Library";
  const html = `
  <div style="font-family:'Segoe UI', Roboto, sans-serif; background:#f8fafc; padding:32px;">
    <div style="max-width:520px; margin:auto; background:#ffffff; border-radius:16px; 
      box-shadow:0 4px 20px rgba(0,0,0,0.08); padding:32px 40px;">
      <h2 style="color:#4F46E5; text-align:center; font-size:22px; margin:0 0 24px;">
        Xác minh thay đổi mật khẩu
      </h2>
      <p style="font-size:15px; color:#334155; margin:0 0 8px;">Xin chào <b>${userName}</b>,</p>
      <p style="font-size:15px; color:#334155; margin:0 0 12px;">Mã OTP của bạn là:</p>
      <div style="text-align:center; font-size:36px; font-weight:700; letter-spacing:6px; color:#4F46E5; margin:16px 0;">
        ${code}
      </div>
      <p style="font-size:14px; color:#64748B; line-height:1.6;">
        Mã có hiệu lực trong <b>10 phút</b>. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.
      </p>
    </div>
    <p style="text-align:center; font-size:12px; color:#94a3b8; margin-top:20px;">
      © 2025 HBH Library System
    </p>
  </div>
  `;

  await sendMail(to, subject, html, "change-password");
};

// email thông báo khi admin duyệt phiếu mượn
export const sendBorrowApprovedEmail = async (
  to: string,
  userName: string,
  ticketNumber: string,
  books: Array<{ book_title?: string; title?: string }>,
  pickupDate: string,
  dueDate: string
): Promise<void> => {
  const subject = `Phiếu mượn ${ticketNumber} đã được duyệt - Hãy đến lấy sách`;

  const bookList = books
    .map((book, index) => {
      const title = book.book_title || book.title || "Không xác định";
      return `<li style="margin:6px 0; color:#334155;">${index + 1}. ${title}</li>`;
    })
    .join("");

  const html = `
  <div style="font-family:'Segoe UI', sans-serif; background:#f8fafc; padding:32px;">
    <div style="max-width:520px; margin:auto; background:#ffffff; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); padding:32px 40px;">
      <h2 style="color:#10B981; text-align:center; font-size:22px; margin:0 0 24px;">
        Phiếu mượn đã được duyệt
      </h2>
      <p style="font-size:15px; color:#334155; margin:0 0 8px;">Xin chào <b>${userName}</b>,</p>
      <p style="font-size:15px; color:#334155; margin:0 0 16px;">
        Phiếu mượn <b style="color:#4F46E5;">${ticketNumber}</b> của bạn đã được duyệt.
      </p>

      <div style="background:#F0FDF4; border-left:4px solid #10B981; padding:16px; margin:16px 0; border-radius:8px;">
        <p style="margin:0 0 8px; font-weight:600; color:#065F46;">Thông tin lấy sách:</p>
        <p style="margin:4px 0; color:#166534;">• Ngày: <b>${pickupDate}</b></p>
        <p style="margin:4px 0; color:#166534;">• Giờ: <b>8:00 - 17:00</b></p>
        <p style="margin:4px 0; color:#166534;">• Địa điểm: <b>Thư viện Trường</b></p>
      </div>

      <div style="margin:20px 0;">
        <p style="margin:0 0 8px; font-weight:600; color:#334155;">Danh sách sách:</p>
        <ul style="padding-left:20px; margin:8px 0;">${bookList}</ul>
      </div>

      <div style="background:#FEF3C7; border-left:4px solid #F59E0B; padding:12px; margin:16px 0; border-radius:8px;">
        <p style="margin:0; font-size:14px; color:#92400E;">
          <b>Lưu ý:</b> Hạn trả sách là <b>${dueDate}</b>
        </p>
      </div>

      <p style="font-size:14px; color:#64748B; line-height:1.6; margin-top:16px;">
        Nếu không đến lấy sách trong vòng 3 ngày, phiếu mượn sẽ tự động bị hủy.
      </p>
    </div>
    <p style="text-align:center; font-size:12px; color:#94a3b8; margin-top:20px;">
      © 2025 HBH Library System
    </p>
  </div>
  `;

  await sendMail(to, subject, html, "borrow-approved");
};

// email cảm ơn khi trả sách
export const sendReturnedThankYouEmail = async (
  to: string,
  userName: string,
  ticketNumber: string,
  books: Array<{ book_title?: string; title?: string }>,
  returnDate: string
): Promise<void> => {
  const subject = "Cảm ơn bạn đã trả sách - Thư viện HBH";

  const bookList = books
    .map((book, index) => {
      const title = book.book_title || book.title || "Không xác định";
      return `<li style="margin:6px 0; color:#334155;">${index + 1}. ${title}</li>`;
    })
    .join("");

  const html = `
  <div style="font-family:'Segoe UI', sans-serif; background:#f8fafc; padding:32px;">
    <div style="max-width:520px; margin:auto; background:#ffffff; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); padding:32px 40px;">
      <h2 style="color:#4F46E5; text-align:center; font-size:22px; margin:0 0 24px;">
        🎉 Cảm ơn bạn!
      </h2>
      <p style="font-size:15px; color:#334155; margin:0 0 8px;">Xin chào <b>${userName}</b>,</p>
      <p style="font-size:15px; color:#334155; margin:0 0 16px;">
        Bạn đã trả sách thành công cho phiếu mượn <b style="color:#4F46E5;">${ticketNumber}</b>.
      </p>

      <div style="background:#EEF2FF; border-left:4px solid #4F46E5; padding:16px; margin:16px 0; border-radius:8px;">
        <p style="margin:0 0 8px; font-weight:600; color:#3730A3;">Thông tin trả sách:</p>
        <p style="margin:4px 0; color:#4338CA;">• Ngày trả: <b>${returnDate}</b></p>
      </div>

      <div style="margin:20px 0;">
        <p style="margin:0 0 8px; font-weight:600; color:#334155;">Danh sách sách đã trả:</p>
        <ul style="padding-left:20px; margin:8px 0;">${bookList}</ul>
      </div>

      <p style="font-size:15px; color:#334155; line-height:1.6; margin-top:20px;">
        Cảm ơn bạn đã tuân thủ quy định và trả sách đúng hạn. 
        Chúc bạn có những trải nghiệm tuyệt vời với thư viện!
      </p>

      <div style="text-align:center; margin-top:24px;">
        <p style="margin:0; color:#64748B; font-size:14px;">Hẹn gặp lại bạn!</p>
      </div>
    </div>
    <p style="text-align:center; font-size:12px; color:#94a3b8; margin-top:20px;">
      © 2025 HBH Library System
    </p>
  </div>
  `;

  await sendMail(to, subject, html, "return-thank-you");
};
