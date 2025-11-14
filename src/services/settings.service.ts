import connection from "../config/db.ts";
import { settingsModel } from "../models/index.ts";
import { v4 as uuidv4 } from "uuid";

export class SettingsService {
  static async getSettingByKey(
    key: string
  ): Promise<settingsModel.SystemSetting | null> {
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM system_settings WHERE `setting_key` = ?",
        [key]
      );

      const settings = rows as settingsModel.SystemSetting[];
      return settings.length > 0 ? settings[0] : null;
    } catch (error) {
      console.error("Error fetching setting:", error);
      throw error;
    }
  }

  static async getAllSettings(): Promise<settingsModel.SystemSetting[]> {
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM system_settings ORDER BY updated_at DESC"
      );
      return rows as settingsModel.SystemSetting[];
    } catch (error) {
      console.error("Error fetching all settings:", error);
      throw error;
    }
  }

  static async createSetting(
    input: settingsModel.CreateSettingInput
  ): Promise<settingsModel.SystemSetting> {
    try {
      const id = uuidv4();

      await connection.execute(
        "INSERT INTO system_settings (`id`, `setting_key`, `setting_value`, `allow_student_info_edit`, `description`) VALUES (?, ?, ?, ?, ?)",
        [
          id,
          input.setting_key,
          input.setting_value,
          input.allow_student_info_edit ?? true,
          input.description || null,
        ]
      );

      return this.getSettingByKey(
        input.setting_key
      ) as Promise<settingsModel.SystemSetting>;
    } catch (error) {
      console.error("Error creating setting:", error);
      throw error;
    }
  }

  static async updateSettingByKey(
    key: string,
    input: settingsModel.UpdateSettingInput
  ): Promise<settingsModel.SystemSetting> {
    try {
      const updates: string[] = [];
      const values: unknown[] = [];

      if (input.setting_value !== undefined) {
        updates.push("`setting_value` = ?");
        values.push(input.setting_value);
      }
      if (input.allow_student_info_edit !== undefined) {
        updates.push("`allow_student_info_edit` = ?");
        values.push(input.allow_student_info_edit);
      }
      if (input.description !== undefined) {
        updates.push("`description` = ?");
        values.push(input.description);
      }

      updates.push("`updated_at` = CURRENT_TIMESTAMP");

      values.push(key);

      const query = `UPDATE system_settings SET ${updates.join(", ")} WHERE \`setting_key\` = ?`;
      await connection.execute(query, values);

      return this.getSettingByKey(key) as Promise<settingsModel.SystemSetting>;
    } catch (error) {
      console.error("Error updating setting:", error);
      throw error;
    }
  }

  static async deleteSettingByKey(key: string): Promise<boolean> {
    try {
      const [result] = await connection.execute(
        "DELETE FROM system_settings WHERE `setting_key` = ?",
        [key]
      );

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Error deleting setting:", error);
      throw error;
    }
  }

  static async toggleBooleanSetting(key: string): Promise<boolean> {
    try {
      const current = await this.getSettingByKey(key);
      const newValue = current
        ? !(JSON.parse(current.setting_value) as boolean)
        : true;

      await this.updateSettingByKey(key, {
        setting_value: JSON.stringify(newValue),
      });
      return newValue;
    } catch (error) {
      console.error("Error toggling setting:", error);
      throw error;
    }
  }
}

export default SettingsService;
