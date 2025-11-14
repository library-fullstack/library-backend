import { RowDataPacket } from "mysql2";

// System settings data from system_settings table
interface SystemSetting extends RowDataPacket {
  id: string;
  setting_key: string; // e.g., "disable_event_effects"
  setting_value: string; // JSON string value
  allow_student_info_edit?: boolean;
  description?: string;
  updated_at?: Date;
}

// When creating/updating a setting
interface CreateSettingInput {
  setting_key: string;
  setting_value: string;
  allow_student_info_edit?: boolean;
  description?: string;
}

type UpdateSettingInput = Partial<CreateSettingInput>;

// Response format for API
interface SettingResponse {
  success: boolean;
  message: string;
  data?: SystemSetting | SystemSetting[];
}

export type {
  SystemSetting,
  CreateSettingInput,
  UpdateSettingInput,
  SettingResponse,
};
