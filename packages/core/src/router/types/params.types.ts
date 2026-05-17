import { PaginationParams } from "./routes.types";
import { Expand } from "./util.types";

type ExtractUrlParams<Path extends string> = Path extends `${string}/:${infer Param}/${infer Rest}`
  ? Param | ExtractUrlParams<Rest>
  : Path extends `${string}/:${infer Param}`
    ? Param
    : never;

// Helper to use Expand with Path
export type Params<Path extends string> = Expand<{
  [K in ExtractUrlParams<Path>]: string;
}>;

export type EndpointParams<
  Path extends string,
  Query extends unknown | undefined = undefined,
  Pagination extends PaginationParams | undefined = undefined,
> = {
  path: Path;
  url: keyof Params<Path> extends never ? undefined : Params<Path>;
  query: Query;
  pagination: Pagination;
};
