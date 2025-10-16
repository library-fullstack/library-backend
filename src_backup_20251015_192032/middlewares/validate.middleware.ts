import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const validate =
  (schemaName: "createUser" | "updateBook" | "login") =>
  (req: Request, res: Response, next: NextFunction) => {
    let schema: Joi.ObjectSchema | null = null;

    switch (schemaName) {
      case "createUser":
        schema = Joi.object({
          studentId: Joi.when("role", {
            is: "STUDENT",
            then: Joi.string().required().messages({
              "any.required": `"studentId" là bắt buộc với sinh viên`,
            }),
            otherwise: Joi.string().allow(null, "").optional(),
          }),
          fullName: Joi.string().required().messages({
            "any.required": `"fullName" là bắt buộc`,
          }),
          email: Joi.string().email().required(),
          password: Joi.string().min(6).required(),
          role: Joi.string().valid("STUDENT", "ADMIN").default("STUDENT"),
        });
        break;

      case "login":
        schema = Joi.object({
          identifier: Joi.string().required(),
          password: Joi.string().required(),
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
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        details: error.details.map((d) => d.message),
      });
    }

    next();
  };

export { validate };
