declare global {
  type Session = {
    id: string;
    provider: "google" | "credential";
    userId: string;
    cookie: CookieOptions;
    ip: string;
    userAgent: UAParser.IResult;
    lastAccess: Date;
    createAt: Date;
  };
}
