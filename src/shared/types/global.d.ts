export {};

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
}
