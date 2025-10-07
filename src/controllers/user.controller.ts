import { Request, Response } from "express";
import { UserService } from "../services/user.service.ts";

export const UserController = {
  async getAll(req: Request, res: Response) {
    const users = await UserService.getAll();
    res.json(users);
  },

  async createUser(req: Request, res: Response) {
    try {
      const { studentId, fullName, email, password, phone } = req.body;

      if (!studentId || !fullName || !email) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      await UserService.createUser({
        studentId,
        fullName,
        email,
        password,
        phone,
      });

      res.status(201).json({
        message: "Đăng ký thành công",
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
