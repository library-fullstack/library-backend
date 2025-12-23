import { RowDataPacket } from "mysql2";

export interface SystemSetting extends RowDataPacket {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: Date;
}

export interface CreateSystemSettingInput {
  setting_key: string;
  setting_value: string;
  description?: string | null;
}

export interface UpdateSystemSettingInput {
  setting_value: string;
  description?: string | null;
}
