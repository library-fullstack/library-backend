import connection from "../../config/db.ts";

export interface ForumSettings {
  allow_students_create_post: boolean;
  allow_librarians_create_post: boolean;
  allow_moderators_create_post: boolean;
  allow_students_create_comment: boolean;
  allow_students_create_report: boolean;
  moderation_required: boolean;
  updated_at?: string;
}

const ForumSettingsService = {
  async getSettings(): Promise<ForumSettings> {
    try {
      // Check if system_settings table exists
      const checkTableQuery = `
        SHOW TABLES LIKE 'system_settings'
      `;
      const [tableExists] = await connection.query(checkTableQuery);

      // Return default settings if table doesn't exist
      if (!Array.isArray(tableExists) || tableExists.length === 0) {
        console.log("system_settings table not found, returning defaults");
        return {
          allow_students_create_post: false,
          allow_librarians_create_post: true,
          allow_moderators_create_post: true,
          allow_students_create_comment: true,
          allow_students_create_report: true,
          moderation_required: true,
        };
      }

      const query = `
        SELECT *
        FROM system_settings
        WHERE setting_key LIKE 'forum_%'
        ORDER BY setting_key
      `;
      const [rows] = await connection.query(query);

      const settings: ForumSettings = {
        allow_students_create_post: false,
        allow_librarians_create_post: true,
        allow_moderators_create_post: true,
        allow_students_create_comment: true,
        allow_students_create_report: true,
        moderation_required: true,
      };

      if (Array.isArray(rows) && rows.length > 0) {
        rows.forEach((row: any) => {
          const key = row.setting_key;
          const value = row.setting_value;

          if (key === "forum_allow_students_create_post") {
            settings.allow_students_create_post =
              value === "true" || value === "1" || value === true;
          } else if (key === "forum_allow_librarians_create_post") {
            settings.allow_librarians_create_post =
              value === "true" || value === "1" || value === true;
          } else if (key === "forum_allow_moderators_create_post") {
            settings.allow_moderators_create_post =
              value === "true" || value === "1" || value === true;
          } else if (key === "forum_allow_students_create_comment") {
            settings.allow_students_create_comment =
              value === "true" || value === "1" || value === true;
          } else if (key === "forum_allow_students_create_report") {
            settings.allow_students_create_report =
              value === "true" || value === "1" || value === true;
          } else if (key === "forum_moderation_required") {
            settings.moderation_required =
              value === "true" || value === "1" || value === true;
          }
        });
      } else {
        // Insert default settings if not found
        await this.initializeDefaultSettings();
      }

      return settings;
    } catch (error) {
      console.error("ForumSettingsService.getSettings error:", error);
      // Return defaults on error instead of throwing
      return {
        allow_students_create_post: false,
        allow_librarians_create_post: true,
        allow_moderators_create_post: true,
        allow_students_create_comment: true,
        allow_students_create_report: true,
        moderation_required: true,
      };
    }
  },

  async initializeDefaultSettings(): Promise<void> {
    const defaults = [
      {
        key: "forum_allow_students_create_post",
        value: "false",
        description: "Allow students to create forum posts",
      },
      {
        key: "forum_allow_librarians_create_post",
        value: "true",
        description: "Allow librarians to create forum posts",
      },
      {
        key: "forum_allow_moderators_create_post",
        value: "true",
        description: "Allow moderators to create forum posts",
      },
      {
        key: "forum_allow_students_create_comment",
        value: "true",
        description: "Allow students to create comments",
      },
      {
        key: "forum_allow_students_create_report",
        value: "true",
        description: "Allow students to report content",
      },
      {
        key: "forum_moderation_required",
        value: "true",
        description: "Require moderation for new posts",
      },
    ];

    for (const setting of defaults) {
      const insertQuery = `
        INSERT INTO system_settings (id, setting_key, setting_value, description, updated_at, allow_student_info_edit)
        VALUES (UUID(), ?, ?, ?, NOW(), 1)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `;
      await connection.query(insertQuery, [
        setting.key,
        setting.value,
        setting.description,
      ]);
    }
    console.log("Forum default settings initialized");
  },

  async updateSettings(settings: Partial<ForumSettings>): Promise<void> {
    try {
      const updates = [
        {
          key: "forum_allow_students_create_post",
          value: settings.allow_students_create_post ? "1" : "0",
        },
        {
          key: "forum_allow_librarians_create_post",
          value: settings.allow_librarians_create_post ? "1" : "0",
        },
        {
          key: "forum_allow_moderators_create_post",
          value: settings.allow_moderators_create_post ? "1" : "0",
        },
        {
          key: "forum_allow_students_create_comment",
          value: settings.allow_students_create_comment ? "1" : "0",
        },
        {
          key: "forum_allow_students_create_report",
          value: settings.allow_students_create_report ? "1" : "0",
        },
        {
          key: "forum_moderation_required",
          value: settings.moderation_required ? "1" : "0",
        },
      ];

      for (const update of updates) {
        if (update.value !== undefined) {
          const query = `
            INSERT INTO system_settings (id, setting_key, setting_value, updated_at, allow_student_info_edit)
            VALUES (UUID(), ?, ?, NOW(), 1)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
          `;
          await connection.query(query, [update.key, update.value]);
        }
      }
    } catch (error) {
      console.error("ForumSettingsService.updateSettings error:", error);
      throw error;
    }
  },
};

export default ForumSettingsService;
