import bcrypt from "bcrypt";
import "dotenv/config";

export const SALT_ROUNDS = 10;
const PEPPER = process.env.PASSWORD_PEPPER || "";

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
const isHashed = (value: string): boolean => {
  return /^\$2[aby]\$\d{2}\$/.test(value);
};

export { hashPassword, verifyPassword, isHashed };
