declare global {
  interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
    priority?: "low" | "medium" | "high";
    // signed?: boolean;
    // partitioned?: boolean;
    // encode?: (val: string) => string;
  }

  type Metadata = {
    totalItem: number;
    totalPage: number;
    hasNextPage: number | boolean;
    limit: number;
    itemStart: number;
    itemEnd: number;
  };

  type ReqInfo = {
    userId: string;
    ip: string;
    userAgentRaw: string;
    provider: "credential" | "google";
    cookie?: CookieOptions;
  };

  export interface ImageURL {
    id: string;
    width: number;
    height: number;
    fileName: string;
    url: string;
    size: number;
    created_at: Date;
  }

  export interface Image {
    id: string;
    width: number;
    height: number;
    is_primary: boolean;
    original_name: string;
    mime_type: string;
    destination: string;
    file_name: string;
    size: number;
    created_at: Date;
  }
}
export {};
