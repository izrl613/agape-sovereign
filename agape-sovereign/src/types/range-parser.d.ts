declare module "range-parser" {
  export interface Options {
    offset?: number;
    limit?: number;
  }

  export type Ranges = Array<[number, number]>;
  export type Result = Array<[number, number]>;

  export function rangeParser(length: number, str: string, options?: Options): Result;
}
