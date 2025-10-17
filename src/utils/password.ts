import bcrypt from "bcrypt";
import { requireEnv } from "../config/env.ts";

export const SALT_ROUNDS = 10;
const PEPPER = requireEnv("PASSWORD_PEPPER") || "";

const hashPassword = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain + PEPPER, SALT_ROUNDS);
};

const verifyPassword = async (
  plain: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(plain + PEPPER, hash);
};

// check băm hay chưa băm
const isHashed = (value: string): boolean =>
  ["$2a$", "$2b$", "$2y$"].some((prefix) => value.startsWith(prefix));

export { hashPassword, verifyPassword, isHashed };
