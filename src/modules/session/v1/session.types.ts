export type Session = {
  id: string;
  provider: "google" | "credential";
  userId: string;
  cookie: CookieOptions;
  ip: string;
  userAgent: UAParser.IResult;
  lastAccess: Date;
  createAt: Date;
};

export interface ISessionRepository {
  create(data: ReqInfo): Promise<{ sessionId: string; cookie: CookieOptions }>;
  findById(id: string): Promise<Session | null>;
  refresh(id: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  delete(id: string): Promise<void>;
}
