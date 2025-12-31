import db from "../config/db";
import { v4 as uuidv4 } from "uuid";
import type {
  SystemSetting,
  CreateSystemSettingInput,
  UpdateSystemSettingInput,
} from "../models/systemSettings.model";

class SystemSettingsService {
  async getAll(): Promise<SystemSetting[]> {
    const query = `SELECT * FROM system_settings ORDER BY setting_key`;
    const [rows] = await db.execute<SystemSetting[]>(query);
    return rows;
  }

  async getByKey(key: string): Promise<SystemSetting | null> {
    const query = `SELECT * FROM system_settings WHERE setting_key = ?`;
    const [rows] = await db.execute<SystemSetting[]>(query, [key]);
    return rows[0] || null;
  }

  async create(data: CreateSystemSettingInput): Promise<string> {
    const id = uuidv4();
    const query = `
      INSERT INTO system_settings (id, setting_key, setting_value, description)
      VALUES (?, ?, ?, ?)
    `;

    await db.execute(query, [
      id,
      data.setting_key,
      data.setting_value,
      data.description || null,
    ]);

    return id;
  }

  async update(key: string, data: UpdateSystemSettingInput): Promise<boolean> {
    const query = `
      UPDATE system_settings
      SET setting_value = ?, description = ?, updated_at = NOW()
      WHERE setting_key = ?
    `;

    const [result] = await db.execute<any>(query, [
      data.setting_value,
      data.description || null,
      key,
    ]);

    return (result.affectedRows || 0) > 0;
  }

  async upsert(
    key: string,
    value: string,
    description?: string
  ): Promise<void> {
    const existing = await this.getByKey(key);

    if (existing) {
      await this.update(key, { setting_value: value, description });
    } else {
      await this.create({
        setting_key: key,
        setting_value: value,
        description,
      });
    }
  }

  async delete(key: string): Promise<boolean> {
    const query = `DELETE FROM system_settings WHERE setting_key = ?`;
    const [result] = await db.execute<any>(query, [key]);
    return (result.affectedRows || 0) > 0;
  }

  async getMultiple(keys: string[]): Promise<Record<string, string>> {
    if (keys.length === 0) return {};

    const placeholders = keys.map(() => "?").join(",");
    const query = `
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key IN (${placeholders})
    `;

    const [rows] = await db.execute<SystemSetting[]>(query, keys);

    const result: Record<string, string> = {};
    rows.forEach((row) => {
      result[row.setting_key] = row.setting_value;
    });

    return result;
  }
}

export default new SystemSettingsService();
