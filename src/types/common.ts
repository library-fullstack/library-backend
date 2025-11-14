export enum BookSortOption {
  NEWEST = "newest",
  OLDEST = "oldest",
  NEWEST_ADDED = "newest_added",
  OLDEST_ADDED = "oldest_added",
  TITLE_ASC = "title_asc",
  TITLE_DESC = "title_desc",
  POPULAR = "popular",
}

// sắp xếp book
export type BookSortBy =
  | "newest"
  | "oldest"
  | "newest_added"
  | "oldest_added"
  | "title_asc"
  | "title_desc"
  | "popular";

// book filter params để truy vấn sách
export interface BookFilters {
  keyword?: string;
  categoryId?: number;
  status?: string;
  sortBy?: BookSortBy;
  limit?: number;
  offset?: number;
  cursor?: number; // Cursor-based pagination
  searchType?: "all" | "author" | "title" | "publisher"; // Loại tìm kiếm
}

// check
export function isValidBookSort(value: string): value is BookSortBy {
  return Object.values(BookSortOption).includes(value as BookSortOption);
}
