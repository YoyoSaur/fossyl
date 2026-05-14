import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/rule-factory';
import { getRouteInfo } from '../utils/route-collector';

export type MessageIds = 'pathPrefixMismatch';

export type Options = [
  {
    prefixes?: string[];
  },
];

export default createRule<Options, MessageIds>({
  name: 'path-prefix-convention',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce that route paths start with a required prefix (e.g., /api/).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          prefixes: {
            type: 'array',
            items: { type: 'string' },
            description:
              'List of allowed prefixes that route paths must start with.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      pathPrefixMismatch:
        "Route path '{{path}}' should start with one of the following prefixes: {{prefixes}}.",
    },
  },
  defaultOptions: [{ prefixes: ['/api/'] }],
  create(context, [options]) {
    const allowedPrefixes = options.prefixes ?? ['/api/'];

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const routeInfo = getRouteInfo(node);
        if (!routeInfo) return;

        const matchesPrefix = allowedPrefixes.some((prefix) =>
          routeInfo.path.startsWith(prefix),
        );

        if (!matchesPrefix) {
          context.report({
            node,
            messageId: 'pathPrefixMismatch',
            data: {
              path: routeInfo.path,
              prefixes: allowedPrefixes.join(', '),
            },
          });
        }
      },
    };
  },
});
