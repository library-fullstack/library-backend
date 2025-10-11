import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validate =
  (schemaName: "createUser" | "updateBook" | "login") =>
  (req: Request, res: Response, next: NextFunction) => {
    let schema;

    if (schemaName === "createUser") {
      schema = Joi.object({
        studentId: Joi.string().required(),
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
      });
    }

    if (schemaName === "login") {
      schema = Joi.object({
        identifier: Joi.string().required(),
        password: Joi.string().required(),
      });
    }

    if (!schema) {
      return res.status(400).json({ message: "Schema không hợp lệ" });
    }

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ message: error.details[0].message || "Dữ liệu không hợp lệ" });

    next();
  };
