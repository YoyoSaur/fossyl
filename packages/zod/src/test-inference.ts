import { z } from "zod";

type ValidatorFunction<T> = (data: unknown) => T;
type ResponseData = { typeName: string };

type EndpointCreationFunction = {
  <Res extends ResponseData, RequestBody, Query>(config: {
    validator: ValidatorFunction<RequestBody>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { query: Query }, body: RequestBody) => Promise<Res>;
  }): { body: RequestBody; query: Query };

  <Res extends ResponseData, RequestBody>(config: {
    validator: ValidatorFunction<RequestBody>;
    queryValidator?: never;
    handler: (params: {}, body: RequestBody) => Promise<Res>;
  }): { body: RequestBody };
};
declare const post: EndpointCreationFunction;

const userSchema = z.object({ name: z.string(), email: z.string() });
const querySchema = z.object({ limit: z.number() });

function zodValidator<T extends z.ZodTypeAny>(schema: T): T["parse"] {
  return schema.parse.bind(schema);
}

// Test 1: Body only
const t1 = post({
  validator: zodValidator(userSchema),
  handler: async (p, body) => { 
    // These should work
    const name: string = body.name;
    const email: string = body.email;
    // @ts-expect-error - This should error (notAField doesn't exist)
    body.notAField;
    return { typeName: "X" }; 
  },
});

// Test 2: Body + Query
const t2 = post({
  validator: zodValidator(userSchema),
  queryValidator: zodValidator(querySchema),
  handler: async (p, body) => { 
    const name: string = body.name;
    const limit: number = p.query.limit;
    // @ts-expect-error - This should error
    p.query.notAField;
    return { typeName: "X" }; 
  },
});

// Verify result types
const _name: string = t1.body.name;
const _email: string = t1.body.email;
const _limit: number = t2.query.limit;
