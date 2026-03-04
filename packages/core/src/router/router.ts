import {
  Authentication,
  ResponseData,
  FullRoute,
  ValidatedRoute,
  AuthenticatedRoute,
  OpenRoute,
  ListRoute,
  AuthenticatedListRoute,
  PaginationConfig,
  PaginationParams,
  PaginatedResponse,
} from "./types/routes.types";
import { Endpoint, Router } from "./types/router-creation.types";
import { AuthenticationFunction, ValidatorFunction } from "./types/configuration.types";
import { Params } from "./types/params.types";
import { StreamOpenRoute, StreamAuthenticatedRoute, StreamEvent } from "./types/stream.types";

/**
 * Creates an endpoint which can be used to create final routes from.
 * Routes must be fully qualified. This is provided as a helper function
 * @param path
 */

// Function overloads in TypeScript are only allowed for functions, not for object properties.
// When you try to declare multiple properties with the same name (like `get`) in an object literal,
// you get a syntax error: "An object literal cannot have multiple properties with the same name."
// Additionally, the type signatures for overloaded methods must be declared as overloads on a function, not as separate properties.
// The correct way is to define a single function for `get` that matches the overload signatures, and then assign it as the property.
//

function createEndpoint<Path extends string>(path: Path): Endpoint<Path> {
  function createNoBodyMethod<Method extends "GET" | "DELETE">(method: Method) {
    function noBodyMethod<Res extends ResponseData>(config: {
      authenticator?: never;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }) => Promise<Res>;
    }): OpenRoute<Path, Method, Res, undefined>;

    // Open route: no auth, with query
    function noBodyMethod<Res extends ResponseData, Query extends unknown>(config: {
      authenticator?: never;
      queryValidator: ValidatorFunction<Query>;
      handler: (params: { url: Params<Path>; query: Query }) => Promise<Res>;
    }): OpenRoute<Path, Method, Res, Query>;

    // Authenticated route: auth, no query
    function noBodyMethod<Res extends ResponseData, Auth extends Authentication>(config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }, auth: Auth) => Promise<Res>;
    }): AuthenticatedRoute<Path, Method, Res, Auth, undefined>;

    // Authenticated route: auth, with query
    function noBodyMethod<
      Res extends ResponseData,
      Auth extends Authentication,
      Query extends unknown,
    >(config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator: ValidatorFunction<Query>;
      handler: (params: { url: Params<Path>; query: Query }, auth: Auth) => Promise<Res>;
    }): AuthenticatedRoute<Path, Method, Res, Auth, Query>;

    function noBodyMethod(
      config:
        | { handler: (params: { url: Params<Path> }) => Promise<any> }
        | {
            queryValidator: ValidatorFunction<any>;
            handler: (params: { url: Params<Path>; query: any }) => Promise<any>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            handler: (params: { url: Params<Path> }, auth: any) => Promise<any>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            queryValidator: ValidatorFunction<any>;
            handler: (params: { url: Params<Path>; query: any }, auth: any) => Promise<any>;
          }
    ): OpenRoute<Path, Method, any, any> | AuthenticatedRoute<Path, Method, any, any, any> {
      if ("authenticator" in config) {
        return {
          ...config,
          type: "authenticated",
          path,
          method,
        } satisfies AuthenticatedRoute<Path, Method, any, any, any>;
      } else {
        return { ...config, type: "open", path, method } satisfies OpenRoute<
          Path,
          Method,
          any,
          any
        >;
      }
    }

    return noBodyMethod;
  }

  function createBodyMethod<Method extends "POST" | "PUT">(method: Method) {
    // Validated route: no auth, no query
    function bodyMethod<Res extends ResponseData, RequestBody extends unknown>(config: {
      authenticator?: never;
      validator: ValidatorFunction<RequestBody>;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }, body: RequestBody) => Promise<Res>;
    }): ValidatedRoute<Path, Method, Res, RequestBody, undefined>;

    // Validated route: no auth, with query
    function bodyMethod<
      Res extends ResponseData,
      RequestBody extends unknown,
      Query extends unknown,
    >(config: {
      authenticator?: never;
      validator: ValidatorFunction<RequestBody>;
      queryValidator: ValidatorFunction<Query>;
      handler: (params: { url: Params<Path>; query: Query }, body: RequestBody) => Promise<Res>;
    }): ValidatedRoute<Path, Method, Res, RequestBody, Query>;

    // Full route: auth + body validation, no query
    function bodyMethod<
      Res extends ResponseData,
      RequestBody extends unknown,
      Auth extends Authentication,
    >(config: {
      authenticator: AuthenticationFunction<Auth>;
      validator: ValidatorFunction<RequestBody>;
      queryValidator?: never;
      handler: (params: { url: Params<Path> }, auth: Auth, body: RequestBody) => Promise<Res>;
    }): FullRoute<Path, Method, Res, RequestBody, Auth, undefined>;

    // Full route: auth + body validation, with query
    function bodyMethod<
      Res extends ResponseData,
      RequestBody extends unknown,
      Auth extends Authentication,
      Query extends unknown,
    >(config: {
      authenticator: AuthenticationFunction<Auth>;
      validator: ValidatorFunction<RequestBody>;
      queryValidator: ValidatorFunction<Query>;
      handler: (
        params: { url: Params<Path>; query: Query },
        auth: Auth,
        body: RequestBody
      ) => Promise<Res>;
    }): FullRoute<Path, Method, Res, RequestBody, Auth, Query>;

    function bodyMethod(
      config:
        | {
            validator: ValidatorFunction<any>;
            handler: (params: { url: Params<Path> }, body: any) => Promise<any>;
          }
        | {
            validator: ValidatorFunction<any>;
            queryValidator: ValidatorFunction<any>;
            handler: (params: { url: Params<Path>; query: any }, body: any) => Promise<any>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            validator: ValidatorFunction<any>;
            handler: (params: { url: Params<Path> }, auth: any, body: any) => Promise<any>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            validator: ValidatorFunction<any>;
            queryValidator: ValidatorFunction<any>;
            handler: (
              params: { url: Params<Path>; query: any },
              auth: any,
              body: any
            ) => Promise<any>;
          }
    ): ValidatedRoute<Path, Method, any, any, any> | FullRoute<Path, Method, any, any, any, any> {
      if ("authenticator" in config) {
        return { ...config, type: "full", path, method } satisfies FullRoute<
          Path,
          Method,
          any,
          any,
          any,
          any
        >;
      } else {
        return { ...config, type: "validated", path, method } satisfies ValidatedRoute<
          Path,
          Method,
          any,
          any,
          any
        >;
      }
    }
    return bodyMethod;
  }

  function createListMethod() {
    // List route: no auth, no query filters
    function listMethod<Data>(config: {
      authenticator?: never;
      queryValidator?: never;
      paginationConfig?: PaginationConfig;
      handler: (params: {
        url: Params<Path>;
        pagination: PaginationParams;
      }) => Promise<PaginatedResponse<Data>>;
    }): ListRoute<Path, Data, undefined>;

    // List route: no auth, with query filters
    function listMethod<Data, Query extends unknown>(config: {
      authenticator?: never;
      queryValidator: ValidatorFunction<Query>;
      paginationConfig?: PaginationConfig;
      handler: (params: {
        url: Params<Path>;
        query: Query;
        pagination: PaginationParams;
      }) => Promise<PaginatedResponse<Data>>;
    }): ListRoute<Path, Data, Query>;

    // Authenticated list route: auth, no query filters
    function listMethod<Data, Auth extends Authentication>(config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator?: never;
      paginationConfig?: PaginationConfig;
      handler: (
        params: {
          url: Params<Path>;
          pagination: PaginationParams;
        },
        auth: Auth
      ) => Promise<PaginatedResponse<Data>>;
    }): AuthenticatedListRoute<Path, Data, Auth, undefined>;

    // Authenticated list route: auth, with query filters
    function listMethod<Data, Auth extends Authentication, Query extends unknown>(config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator: ValidatorFunction<Query>;
      paginationConfig?: PaginationConfig;
      handler: (
        params: {
          url: Params<Path>;
          query: Query;
          pagination: PaginationParams;
        },
        auth: Auth
      ) => Promise<PaginatedResponse<Data>>;
    }): AuthenticatedListRoute<Path, Data, Auth, Query>;

    function listMethod(
      config:
        | {
            paginationConfig?: PaginationConfig;
            handler: (params: {
              url: Params<Path>;
              pagination: PaginationParams;
            }) => Promise<PaginatedResponse<any>>;
          }
        | {
            queryValidator: ValidatorFunction<any>;
            paginationConfig?: PaginationConfig;
            handler: (params: {
              url: Params<Path>;
              query: any;
              pagination: PaginationParams;
            }) => Promise<PaginatedResponse<any>>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            paginationConfig?: PaginationConfig;
            handler: (
              params: {
                url: Params<Path>;
                pagination: PaginationParams;
              },
              auth: any
            ) => Promise<PaginatedResponse<any>>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            queryValidator: ValidatorFunction<any>;
            paginationConfig?: PaginationConfig;
            handler: (
              params: {
                url: Params<Path>;
                query: any;
                pagination: PaginationParams;
              },
              auth: any
            ) => Promise<PaginatedResponse<any>>;
          }
    ): ListRoute<Path, any, any> | AuthenticatedListRoute<Path, any, any, any> {
      if ("authenticator" in config) {
        return {
          type: "authenticated-list" as const,
          path,
          method: "GET" as const,
          authenticator: config.authenticator,
          queryValidator: "queryValidator" in config ? config.queryValidator : undefined,
          paginationConfig: config.paginationConfig,
          handler: config.handler,
        } as AuthenticatedListRoute<Path, any, any, any>;
      } else {
        return {
          type: "list" as const,
          path,
          method: "GET" as const,
          queryValidator: "queryValidator" in config ? config.queryValidator : undefined,
          paginationConfig: config.paginationConfig,
          handler: config.handler,
        } as ListRoute<Path, any, any>;
      }
    }

    return listMethod;
  }

  function createStreamMethod() {
    // Stream-open: no auth, no query
    function streamMethod<Events extends StreamEvent>(config: {
      authenticator?: never;
      queryValidator?: never;
      handler: (params: { url: Params<Path>; signal: AbortSignal }) => AsyncIterable<Events>;
    }): StreamOpenRoute<Path, Events, undefined>;

    // Stream-open: no auth, with query
    function streamMethod<Events extends StreamEvent, Query extends unknown>(config: {
      authenticator?: never;
      queryValidator: ValidatorFunction<Query>;
      handler: (params: {
        url: Params<Path>;
        query: Query;
        signal: AbortSignal;
      }) => AsyncIterable<Events>;
    }): StreamOpenRoute<Path, Events, Query>;

    // Stream-authenticated: auth, no query
    function streamMethod<Events extends StreamEvent, Auth extends Authentication>(config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator?: never;
      handler: (
        params: { url: Params<Path>; signal: AbortSignal },
        auth: Auth
      ) => AsyncIterable<Events>;
    }): StreamAuthenticatedRoute<Path, Events, Auth, undefined>;

    // Stream-authenticated: auth, with query
    function streamMethod<
      Events extends StreamEvent,
      Auth extends Authentication,
      Query extends unknown,
    >(config: {
      authenticator: AuthenticationFunction<Auth>;
      queryValidator: ValidatorFunction<Query>;
      handler: (
        params: { url: Params<Path>; query: Query; signal: AbortSignal },
        auth: Auth
      ) => AsyncIterable<Events>;
    }): StreamAuthenticatedRoute<Path, Events, Auth, Query>;

    function streamMethod(
      config:
        | { handler: (params: { url: Params<Path>; signal: AbortSignal }) => AsyncIterable<any> }
        | {
            queryValidator: ValidatorFunction<any>;
            handler: (params: {
              url: Params<Path>;
              query: any;
              signal: AbortSignal;
            }) => AsyncIterable<any>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            handler: (
              params: { url: Params<Path>; signal: AbortSignal },
              auth: any
            ) => AsyncIterable<any>;
          }
        | {
            authenticator: AuthenticationFunction<any>;
            queryValidator: ValidatorFunction<any>;
            handler: (
              params: { url: Params<Path>; query: any; signal: AbortSignal },
              auth: any
            ) => AsyncIterable<any>;
          }
    ): StreamOpenRoute<Path, any, any> | StreamAuthenticatedRoute<Path, any, any, any> {
      if ("authenticator" in config) {
        return {
          ...config,
          type: "stream-authenticated",
          path,
          method: "GET",
        } satisfies StreamAuthenticatedRoute<Path, any, any, any>;
      } else {
        return {
          ...config,
          type: "stream-open",
          path,
          method: "GET",
        } satisfies StreamOpenRoute<Path, any, any>;
      }
    }

    return streamMethod;
  }

  return {
    get: createNoBodyMethod("GET"),
    post: createBodyMethod("POST"),
    put: createBodyMethod("PUT"),
    delete: createNoBodyMethod("DELETE"),
    list: createListMethod(),
    stream: createStreamMethod(),
  };
}

/**
 * Provides an Ednpoint creater. Would maybe like some other internal stuff? Lowkey... I think we
 * all might just end up using the helper functions of get and del and such.
 * @param _ - this param is still needed because the type is determined at compile time.
 */
export function createRouter<BasePath extends string>(_: BasePath): Router<BasePath> {
  return {
    createEndpoint: <Path extends `${BasePath}${string}`>(path: Path) => createEndpoint(path),
    createSubrouter: <Path extends `${BasePath}${string}`>(path: Path) => createRouter(path),
  };
}
