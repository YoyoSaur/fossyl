import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/rule-factory';
import { getCreateRouterPrefix, getRelativeFilePath } from '../utils/route-collector';
import path from 'node:path';

export type MessageIds = 'namingMismatch';

export type Options = [];

export default createRule<Options, MessageIds>({
  name: 'consistent-naming',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Route files should have a name consistent with their path prefix (e.g., users.route.ts should use /users prefix).',
    },
    schema: [],
    messages: {
      namingMismatch:
        "Route prefix '{{prefix}}' does not match file name '{{fileName}}'. Expected a prefix related to '/{{expectedPrefix}}'.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filePath = context.filename;
    const fileName = path.basename(filePath);
    const fileNameStem = fileName
      .replace(/\.route\.[a-z]+$/i, '')
      .replace(/\.[a-z]+$/i, '')
      .toLowerCase();

    function fileNameMatchesPrefix(prefix: string): boolean {
      const prefixSegment = prefix.replace(/\/+$/, '').split('/').pop() || '';
      return prefixSegment.toLowerCase() === fileNameStem;
    }

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const prefix = getCreateRouterPrefix(node);
        if (!prefix) return;

        if (!fileNameMatchesPrefix(prefix)) {
          const relPath = getRelativeFilePath(filePath);
          context.report({
            node,
            messageId: 'namingMismatch',
            data: {
              prefix,
              fileName: relPath,
              expectedPrefix: fileNameStem,
            },
          });
        }
      },
    };
  },
});
