import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { Type } from "typescript";
import { createRule } from "../utils/rule-factory";

export type MessageIds = "builderChainNewline";

export type Options = [
  {
    builderTypes: string[];
  },
];

/**
 * All fossyl builder/router types that participate in the chain pattern.
 * These are the defaults — consumers can override via rule config.
 */
const FOSSYL_BUILDER_TYPES = [
  "Router",
  "Endpoint",
  "QueryableRouter",
  "PaginatedRouter",
  "OpenRouter",
  "AuthenticatedRouter",
  "ValidatedRouter",
  "FullRouter",
] as const satisfies string[];

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

function getTypeNames(type: Type): string[] {
  const typeAny = type as Type & {
    isUnion?(): boolean;
    isIntersection?(): boolean;
    types?: Type[];
    symbol?: { getName(): string };
    aliasSymbol?: { getName(): string };
  };

  if (typeAny.isUnion?.() || typeAny.isIntersection?.()) {
    return typeAny.types?.flatMap(getTypeNames) ?? [];
  }

  const names: string[] = [];
  const symName = typeAny.symbol?.getName();
  if (symName) names.push(symName);
  // Also capture alias symbol so type aliases resolve correctly
  const aliasName = typeAny.aliasSymbol?.getName();
  if (aliasName && aliasName !== symName) names.push(aliasName);
  return names;
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

export default createRule<Options, MessageIds>({
  name: "builder-chains-newline",

  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce that chains of 2+ calls on fossyl builder types each appear on their own line",
    },
    fixable: "whitespace",
    schema: [
      {
        type: "object" as const,
        properties: {
          builderTypes: {
            type: "array" as const,
            items: { type: "string" as const },
            minItems: 1,
          },
        },
        additionalProperties: false,
        required: ["builderTypes"],
      },
    ],
    messages: {
      builderChainNewline:
        'Each call in a multi-call chain on builder type "{{typeName}}" must be on its own line.',
    },
  },

  defaultOptions: [{ builderTypes: [...FOSSYL_BUILDER_TYPES] }],

  create(context, [{ builderTypes }]) {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();
    const builderTypeSet = new Set(builderTypes);

    // Nodes we've already reported — avoids double-reporting shared chain members
    const reported = new WeakSet<TSESTree.Node>();

    function getMatchingTypeName(node: TSESTree.Node): string | undefined {
      try {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsNode) return undefined;
        const tsType = checker.getTypeAtLocation(tsNode);
        return getTypeNames(tsType).find((n) => builderTypeSet.has(n));
      } catch {
        return undefined;
      }
    }

    function isBuilderType(node: TSESTree.Node): boolean {
      return getMatchingTypeName(node) !== undefined;
    }

    /**
     * Collect all CallExpression nodes in this chain whose callee-object
     * is a builder type, from outermost inward.
     *
     * For `root.a().b().c()` we return [call_a, call_b, call_c].
     */
    function collectChain(node: TSESTree.CallExpression): TSESTree.CallExpression[] {
      const calls: TSESTree.CallExpression[] = [];
      let current: TSESTree.Node = node;

      while (
        current.type === "CallExpression" &&
        current.callee.type === "MemberExpression" &&
        isBuilderType(current.callee.object)
      ) {
        calls.unshift(current);
        current = current.callee.object;
      }

      return calls;
    }

    /**
     * True when this CallExpression is the outermost call in its chain —
     * i.e. it is NOT the callee-object of a parent MemberExpression/CallExpression.
     */
    function isChainRoot(node: TSESTree.CallExpression): boolean {
      const parent = node.parent;
      return !(
        parent?.type === "MemberExpression" &&
        parent.object === node &&
        parent.parent?.type === "CallExpression"
      );
    }

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (!isChainRoot(node)) return;

        const chain = collectChain(node);

        // Single call (or zero) — nothing to enforce
        if (chain.length < 2) return;

        // The chain root receiver: the node before the first call
        // e.g. the `router` Identifier, or the `createRouter()` CallExpression
        const rootReceiver = (chain[0].callee as TSESTree.MemberExpression).object;

        const typeName =
          getMatchingTypeName(rootReceiver) ??
          getMatchingTypeName(
            chain[0].callee.type === "MemberExpression"
              ? (chain[0].callee as TSESTree.MemberExpression).object
              : chain[0]
          ) ??
          "unknown";

        // Pairs: [previousNode, callNode] — previous ends, call must start on next line
        const pairs: Array<{
          prev: TSESTree.Node;
          call: TSESTree.CallExpression;
        }> = chain.map((call, i) => ({
          prev: i === 0 ? rootReceiver : chain[i - 1],
          call,
        }));

        for (const { prev, call } of pairs) {
          if (reported.has(call)) continue;

          const property = (call.callee as TSESTree.MemberExpression).property;
          const prevEndLine = prev.loc.end.line;
          const propStartLine = property.loc.start.line;

          if (prevEndLine === propStartLine) {
            reported.add(call);

            context.report({
              node: property,
              messageId: "builderChainNewline",
              data: { typeName },
              fix(fixer) {
                const sourceCode = context.sourceCode;
                const dot = sourceCode.getTokenBefore(property);
                if (!dot) return null;

                // Base indent from the line the chain root starts on
                const rootLine = sourceCode.lines[rootReceiver.loc.start.line - 1];
                const baseIndent = rootLine.match(/^(\s*)/)?.[1] ?? "";

                return fixer.replaceTextRange([dot.range[0], dot.range[1]], `\n${baseIndent}  .`);
              },
            });
          }
        }
      },
    };
  },
});
