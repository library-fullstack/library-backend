import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const validate =
  (
    schemaName:
      | "createUser"
      | "updateBook"
      | "login"
      | "forgotPassword"
      | "resetPassword"
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    let schema: Joi.ObjectSchema | null = null;

    switch (schemaName) {
      case "createUser":
        schema = Joi.object({
          student_id: Joi.string().required().messages({
            "any.required": `"student_id" là bắt buộc khi đăng ký`,
            "string.empty": `"student_id" không được để trống`,
          }),
          password: Joi.string().min(6).required().messages({
            "any.required": `"password" là bắt buộc`,
            "string.min": `"password" phải có ít nhất 6 ký tự`,
          }),
          full_name: Joi.string().max(50).optional(),
          email: Joi.string().email().optional(),
          phone: Joi.string()
            .pattern(/^0\d{9}$/)
            .optional()
            .messages({
              "string.pattern.base": `"phone" (10 chữ số, bắt đầu bằng 0)`,
            }),
          role: Joi.string()
            .valid("STUDENT", "LIBRARIAN", "MODERATOR", "ADMIN")
            .optional()
            .default("STUDENT"),
          status: Joi.string()
            .valid("ACTIVE", "INACTIVE", "BANNED")
            .optional()
            .default("ACTIVE"),
        });
        break;

      case "login":
        schema = Joi.object({
          identifier: Joi.string().required(),
          password: Joi.string().required(),
        });
        break;

      case "forgotPassword":
        schema = Joi.object({
          email: Joi.string().email().required().messages({
            "any.required": `"email" là bắt buộc`,
            "string.email": `"email" không hợp lệ`,
            "string.empty": `"email" không được để trống`,
          }),
        });
        break;

      case "resetPassword":
        schema = Joi.object({
          token: Joi.string().required().messages({
            "any.required": `"token" là bắt buộc`,
            "string.empty": `"token" không được để trống`,
          }),
          new_password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
            .required()
            .messages({
              "any.required": `"new_password" là bắt buộc`,
              "string.min": `"new_password" phải có ít nhất 8 ký tự`,
              "string.pattern.base": `"new_password" phải chứa ít nhất 1 chữ và 1 số`,
            }),
        });
        break;
      case "updateBook":
        schema = Joi.object({
          title: Joi.string().optional(),
          author: Joi.string().optional(),
          category: Joi.string().optional(),
        });
        break;

      default:
        return res.status(400).json({ message: "Schema không hợp lệ" });
    }

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      console.error(
        "[Validation Error]",
        error.details.map((d) => d.message)
      );
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        details: error.details.map((d) => d.message),
      });
    }

    next();
  };

export { validate };
