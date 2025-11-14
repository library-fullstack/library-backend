import { RowDataPacket } from "mysql2";

// Banner data in database
interface Banner extends RowDataPacket {
  id: string;
  image: string;
  cloudinary_id?: string;
  overlay: "dark" | "light";
  title: string;
  subtitle: string;
  title_color: string;
  subtitle_color: string;
  button_color: string;
  button_text: string;
  event_type: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
}

// When creating a banner
interface CreateBannerInput {
  image: string;
  overlay: "dark" | "light";
  title: string;
  subtitle: string;
  title_color: string;
  subtitle_color: string;
  button_color: string;
  button_text: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

// When updating a banner
type UpdateBannerInput = Partial<CreateBannerInput>;

// Response format for API
interface BannerResponse {
  success: boolean;
  message: string;
  data?: Banner | Banner[];
}

export { Banner, CreateBannerInput, UpdateBannerInput, BannerResponse };
