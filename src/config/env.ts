import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Thiếu biến môi trường: ${key}`);
  return value;
}

function optionalEnv(key: string, fallback?: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
}

type Env = {
  NODE_ENV: "development" | "production" | "preview" | "test";
  SERVER_PORT: number;

  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  JWT_SECRET: string;
  PASSWORD_PEPPER: string;
  FRONTEND_ORIGINS: string[];
  REDIS_URL?: string;
};

// parse FRONTEND_URLS
const FRONTEND_URLS_RAW =
  optionalEnv("FRONTEND_URLS") ?? optionalEnv("FRONTEND_URL") ?? "";

const FRONTEND_ORIGINS = FRONTEND_URLS_RAW.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// cảnh báo nếu chưa cấu hình danh sách origin (không crash app)
if (FRONTEND_ORIGINS.length === 0) {
  console.warn(
    "Warning: FRONTEND_URLS/FRONTEND_URL not configured. " +
      "CORS will only allow requests with no origin"
  );
}

const env: Env = {
  NODE_ENV: (optionalEnv("NODE_ENV", "development") as Env["NODE_ENV"])!,
  SERVER_PORT: Number(optionalEnv("SERVER_PORT", "4000")),

  DB_HOST: requireEnv("DB_HOST"),
  DB_PORT: Number(optionalEnv("DB_PORT", "3306")),
  DB_USER: requireEnv("DB_USER"),
  DB_PASSWORD: requireEnv("DB_PASSWORD"),
  DB_DATABASE: requireEnv("DB_DATABASE"),

  JWT_SECRET: requireEnv("JWT_SECRET"),
  PASSWORD_PEPPER: requireEnv("PASSWORD_PEPPER"),

  FRONTEND_ORIGINS,
  REDIS_URL: optionalEnv("REDIS_URL", "redis://localhost:6379"),
};

export { env, requireEnv };
