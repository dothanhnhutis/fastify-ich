const dateStringRegex: RegExp = /^\d{4}-\d{2}-\d{2}$/;
const timestamptzStringRegex: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d+)(?:Z|[+-]\d{2}:\d{2})$/;

export const isDataString = (s: string): boolean => dateStringRegex.test(s);
export const isTimestamptzString = (s: string): boolean =>
  timestamptzStringRegex.test(s);
