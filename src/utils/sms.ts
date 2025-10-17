import twilio from "twilio";
import { requireEnv } from "../config/env.ts";

const client = twilio(requireEnv("TWILIO_SID"), requireEnv("TWILIO_TOKEN"));

export const sendSMS = async (to: string, message: string) => {
  await client.messages.create({
    from: requireEnv("TWILIO_PHONE"),
    to,
    body: message,
  });
  console.log(`[SMS] Gửi OTP tới ${to}`);
};
