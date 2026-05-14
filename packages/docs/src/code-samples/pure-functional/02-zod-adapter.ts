// @code-block-start: zod-adapter
// With a validation library like Zod — still just a pure function
import { z } from 'zod';
import { zodValidator } from '@fossyl/zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// zodValidator wraps the schema into a function of the same shape
const createUserValidator = zodValidator(userSchema);
//    ^? (data: unknown) => { name: string; email: string }

const createUserRoute = router.createEndpoint('/users').post({
  validator: createUserValidator,
  handler: async ({ url }, body) => {
    return { typeName: 'User' as const, ...body, id: crypto.randomUUID() };
  },
});
// @code-block-end: zod-adapter
