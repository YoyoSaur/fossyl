import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/rule-factory';
import { getCreateRouterPrefix } from '../utils/route-collector';

export type MessageIds = 'mixedPrefixes';

export type Options = [];

export default createRule<Options, MessageIds>({
  name: 'no-mixed-prefixes',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'All routes in one file must share the same base prefix from createRouter().',
    },
    schema: [],
    messages: {
      mixedPrefixes:
        "File uses multiple router prefixes. '{{prefix}}' is not the primary prefix '{{primaryPrefix}}'. All routes in one file should share the same base prefix.",
    },
  },
  defaultOptions: [],
  create(context) {
    const prefixesInFile: { prefix: string; node: TSESTree.CallExpression }[] = [];

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const prefix = getCreateRouterPrefix(node);
        if (!prefix) return;

        prefixesInFile.push({ prefix, node });
      },

      'Program:exit'(): void {
        if (prefixesInFile.length <= 1) return;

        const primary = prefixesInFile[0].prefix;

        for (let i = 1; i < prefixesInFile.length; i++) {
          const { prefix, node } = prefixesInFile[i];
          context.report({
            node,
            messageId: 'mixedPrefixes',
            data: {
              prefix,
              primaryPrefix: primary,
            },
          });
        }
      },
    };
  },
});
