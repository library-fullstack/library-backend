export enum NotificationType {
  REPLY = "REPLY",
  MENTION = "MENTION",
  MODERATION = "MODERATION",
  SYSTEM = "SYSTEM",
  FAVOURITE = "FAVOURITE",
  BORROW = "BORROW",
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  link?: string;
  borrow_id?: number;
  post_id?: number;
  comment_id?: number;
  book_id?: number;
  rejection_reason?: string;
  [key: string]: any;
}

export interface Notification {
  id: number;
  user_id: string;
  ntype: NotificationType;
  payload: NotificationPayload;
  read_at: Date | null;
  created_at: Date;
}

export interface CreateNotificationInput {
  user_id: string;
  ntype: NotificationType;
  payload: NotificationPayload;
}
