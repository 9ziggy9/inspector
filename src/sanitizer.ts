const REGEX_WHITESPACE: RegExp = /^\s*$/;

export const SanityCheck = {
  addr: (v: string): boolean => v ? !REGEX_WHITESPACE.test(v) : false,
};

export const Sanitizer = {
  addr: (v: string): string | null => v
    ? REGEX_WHITESPACE.test(v)
      ? null
      : v.toLowerCase()
    : null,
  int: (v: string): string => v
    ? REGEX_WHITESPACE.test(v)
      ? "0" // coerce whitespace to zero str
      : v
    : "0", // coerce undefined to zero str
  stat: (v: string): string => v
    ? REGEX_WHITESPACE.test(v)
      ? "open"
      : "closed"
    : "open",
};
