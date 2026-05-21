export type Expand<T> = T extends infer O
  ? { [K in keyof O]: O[K] extends object ? Expand<O[K]> : O[K] }
  : never;

export type StripUndefined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};
