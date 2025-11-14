import { RowDataPacket } from "mysql2";

interface SystemSetting extends RowDataPacket {
  id: string;
  setting_key: string;
  setting_value: string;
  allow_student_info_edit?: boolean;
  description?: string;
  updated_at?: Date;
}

interface CreateSettingInput {
  setting_key: string;
  setting_value: string;
  allow_student_info_edit?: boolean;
  description?: string;
}

type UpdateSettingInput = Partial<CreateSettingInput>;

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
