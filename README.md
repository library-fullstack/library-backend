# Library Management API

Dự án backend quản lý thư viện được phát triển bằng **Node.js + Express + TypeScript + MySQL**.

## Tiến độ & Tính năng đã hoàn thành

### Cấu trúc nền tảng

- [x] Khởi tạo dự án với TypeScript + Express + MySQL
- [x] Cấu hình môi trường `.env`
- [x] Thiết lập ESLint + Prettier + tsx
- [x] Middleware xử lý lỗi tập trung
- [x] Kết nối database qua `mysql2/promise`

### Xác thực & Phân quyền (Auth)

- [x] Đăng ký tài khoản (Sinh viên)
- [x] Đăng nhập bằng Email hoặc Mã sinh viên
- [x] Xác thực người dùng bằng JWT
- [x] Phân quyền theo vai trò (ADMIN / STUDENT)
- [x] Mã hóa mật khẩu bằng bcrypt + pepper
- [x] Middleware xác thực token

### Quản lý Người dùng (User)

- [x] Thêm người dùng mới (ADMIN)
- [x] Lấy danh sách người dùng (ADMIN)
- [x] Lấy chi tiết người dùng
- [x] Cập nhật thông tin người dùng
- [x] Xóa người dùng (ADMIN)
- [x] Kiểm tra dữ liệu bằng Joi

### Quản lý Sách (Book)

- [x] Thêm mới sách (ADMIN)
- [x] Lấy danh sách / chi tiết sách
- [x] Cập nhật thông tin sách
- [x] Xóa sách (ADMIN)
- [x] Kiểm tra dữ liệu đầu vào (title, author, category, ISBN)

### Middleware & Tiện ích

- [x] Middleware xử lý lỗi (`express-async-errors`)
- [x] Middleware xác thực và phân quyền
- [x] Middleware kiểm tra dữ liệu (validate)
- [x] JWT helper (`signToken`, `verifyToken`)
- [x] Password helper (`hashPassword`, `verifyPassword`)

---

## Tính năng đang phát triển

### Quản lý Mượn – Trả

- [ ] Tạo yêu cầu mượn sách
- [ ] Theo dõi hạn trả và tình trạng sách
- [ ] Gửi thông báo nhắc hạn (cron job / email)

### Thanh toán

- [ ] Tích hợp VietQR / PayOS
- [ ] Lưu và kiểm tra lịch sử thanh toán

### Giao hàng (Shipping)

- [ ] Tích hợp API GHN
- [ ] Theo dõi trạng thái vận chuyển

### Giao diện Quản trị (Frontend)

- [ ] Trang quản lý người dùng, sách, yêu cầu mượn
- [ ] Lịch sử mượn – trả sách
- [ ] Thống kê báo cáo tổng hợp
