# Email Categories cho Mailtrap Analytics

## Tổng quan

File này định nghĩa các email categories được sử dụng trong hệ thống để theo dõi analytics trên Mailtrap.

## Danh sách Categories

### 1. **welcome**

- **Mục đích:** Email chào mừng người dùng mới
- **Khi nào gửi:** Sau khi đăng ký tài khoản thành công
- **Function:** `sendWelcomeEmail()`

### 2. **password-reset**

- **Mục đích:** Email đặt lại mật khẩu
- **Khi nào gửi:** Khi người dùng yêu cầu quên mật khẩu
- **Function:** `sendPasswordResetEmail()`

### 3. **borrow-confirmation**

- **Mục đích:** Xác nhận mượn sách thành công
- **Khi nào gửi:** Sau khi người dùng mượn sách
- **Function:** `sendBorrowConfirmationEmail()`

### 4. **return-reminder**

- **Mục đích:** Nhắc nhở trả sách
- **Khi nào gửi:** Trước 3-5 ngày khi sách sắp đến hạn trả
- **Function:** `sendReturnReminderEmail()`

### 5. **overdue-notification**

- **Mục đích:** Thông báo quá hạn trả sách
- **Khi nào gửi:** Khi sách đã quá hạn trả
- **Function:** `sendOverdueNotificationEmail()`

### 6. **account-suspended**

- **Mục đích:** Thông báo tài khoản bị khóa
- **Khi nào gửi:** Khi admin khóa tài khoản người dùng
- **Function:** `sendAccountSuspendedEmail()`

## Cách sử dụng

### Import functions từ emailTemplates.ts:

```typescript
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBorrowConfirmationEmail,
  sendReturnReminderEmail,
  sendOverdueNotificationEmail,
  sendAccountSuspendedEmail,
} from "../utils/emailTemplates.ts";
```

### Ví dụ sử dụng:

```typescript
// 1. Gửi email chào mừng
await sendWelcomeEmail(user.email, user.full_name);

// 2. Gửi email đặt lại mật khẩu
await sendPasswordResetEmail(user.email, user.full_name, resetLink);

// 3. Gửi email xác nhận mượn sách
await sendBorrowConfirmationEmail(
  user.email,
  user.full_name,
  "Clean Code",
  "30/10/2025"
);

// 4. Gửi email nhắc nhở trả sách
await sendReturnReminderEmail(
  user.email,
  user.full_name,
  "Clean Code",
  "30/10/2025",
  3 // còn 3 ngày
);

// 5. Gửi email thông báo quá hạn
await sendOverdueNotificationEmail(
  user.email,
  user.full_name,
  "Clean Code",
  5, // quá hạn 5 ngày
  50000 // phí phạt 50,000 VNĐ
);

// 6. Gửi email tài khoản bị khóa
await sendAccountSuspendedEmail(
  user.email,
  user.full_name,
  "Quá hạn trả sách nhiều lần"
);
```

## Xem Analytics trên Mailtrap

1. Đăng nhập vào **Mailtrap Dashboard**
2. Vào **Email Sending** > **Analytics**
3. Chọn tab **Categories** để xem thống kê theo từng loại email:
   - Số lượng email đã gửi
   - Tỷ lệ mở email (open rate)
   - Tỷ lệ click (click rate)
   - Tỷ lệ bounce
   - Tỷ lệ spam complaint

## Lợi ích của việc sử dụng Categories

✅ **Theo dõi hiệu suất:** Biết loại email nào hoạt động tốt nhất
✅ **Phát hiện vấn đề:** Nhanh chóng phát hiện loại email có vấn đề
✅ **Tối ưu hóa:** Cải thiện nội dung email dựa trên số liệu thực tế
✅ **Báo cáo:** Dễ dàng tạo báo cáo theo từng loại email

## Ghi chú

- Category được gửi qua custom header `X-Category`
- Category không xuất hiện trong email thực tế, chỉ dùng cho tracking
- Có thể thêm categories mới bằng cách thêm parameter thứ 4 vào `sendMail()`

```typescript
await sendMail(to, subject, html, "your-custom-category");
```
