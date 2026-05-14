import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/rule-factory';
import {
  routeStore,
  getRouteInfo,
  getCreateRouterPrefix,
  getRelativeFilePath,
} from '../utils/route-collector';

export type MessageIds = 'duplicateRoute' | 'duplicateRouteDetails';

export type Options = [];

export default createRule<Options, MessageIds>({
  name: 'no-duplicate-routes',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent same METHOD + PATH combination from being defined twice across the project.',
    },
    schema: [],
    messages: {
      duplicateRoute:
        "Duplicate route: {{method}} {{path}} already defined at {{otherFile}}:{{otherLine}}.",
      duplicateRouteDetails:
        "Duplicate route: {{method}} {{path}} is defined {{count}} times across the project.",
    },
  },
  defaultOptions: [],
  create(context) {
    const filePath = context.filename;
    let currentBasePrefix: string | null = null;

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const prefix = getCreateRouterPrefix(node);
        if (prefix) {
          currentBasePrefix = prefix;
          routeStore.setBasePrefix(filePath, prefix);
          return;
        }

        const routeInfo = getRouteInfo(node);
        if (!routeInfo) return;

        routeStore.addRoute(filePath, {
          filePath,
          method: routeInfo.method,
          fullPath: routeInfo.path,
          basePrefix: currentBasePrefix,
          createEndpointNode: routeInfo.node,
          createEndpointLine: routeInfo.node.loc?.start.line ?? 0,
        });
      },

      'Program:exit'(): void {
        const duplicates = routeStore.findDuplicates();

        for (const dup of duplicates) {
          const currentOccurrences = dup.occurrences.filter(
            (o) => o.filePath === filePath,
          );
          if (currentOccurrences.length === 0) continue;

          const firstGlobal = dup.occurrences[0];

          for (const occurrence of currentOccurrences) {
            if (occurrence === firstGlobal) continue;

            const otherRelPath = getRelativeFilePath(firstGlobal.filePath);
            context.report({
              node: occurrence.createEndpointNode,
              messageId: 'duplicateRoute',
              data: {
                method: dup.method,
                path: dup.path,
                otherFile: otherRelPath,
                otherLine: String(firstGlobal.createEndpointLine),
              },
            });
          }
        }
      },
    };
  },
});
