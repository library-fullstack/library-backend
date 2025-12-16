import { RowDataPacket } from "mysql2";

type NotificationType = "REPLY" | "MENTION" | "MODERATION" | "SYSTEM";

interface UserNotification extends RowDataPacket {
  id: number;
  user_id: string;
  ntype: NotificationType;
  payload: {
    postId?: number;
    commentId?: number;
    excerpt?: string;
    byUserId?: string;
    byUserName?: string;
    action?: string;
    [key: string]: any;
  };
  read_at?: Date | null;
  created_at?: Date;
}

interface CreateNotificationInput {
  user_id: string;
  ntype: NotificationType;
  payload: Record<string, any>;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  data?: UserNotification | UserNotification[];
}

export {
  UserNotification,
  CreateNotificationInput,
  NotificationResponse,
  NotificationType,
};
