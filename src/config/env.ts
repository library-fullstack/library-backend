import dotenv from "dotenv";
dotenv.config();

// kiểm tra biến môi trường

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Thiếu biến môi trường: ${key}`);
  return value;
}

type Env = {
  NODE_ENV: "development" | "production" | "test";
  SERVER_PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
};

// export các biến môi trường đã kiểm tra
export const env: Env = {
  NODE_ENV: requireEnv("NODE_ENV") as Env["NODE_ENV"],
  SERVER_PORT: Number(requireEnv("SERVER_PORT")) || 3000,
  DB_HOST: requireEnv("DB_HOST"),
  DB_PORT: Number(requireEnv("DB_PORT")) || 3306,
  DB_USER: requireEnv("DB_USER"),
  DB_PASSWORD: requireEnv("DB_PASSWORD"),
  DB_DATABASE: requireEnv("DB_DATABASE"),
};
