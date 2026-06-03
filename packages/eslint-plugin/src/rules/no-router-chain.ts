import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-factory";

export type MessageIds = "routerChain" | "incompleteEndpointChain";

export type Options = [];

const TERMINAL_METHODS = new Set(["get", "post", "put", "delete"]);

function isCreateEndpointCall(node: TSESTree.CallExpression): boolean {
  return (
    (node.callee.type === "Identifier" && node.callee.name === "createEndpoint") ||
    (node.callee.type === "MemberExpression" &&
      node.callee.property.type === "Identifier" &&
      node.callee.property.name === "createEndpoint")
  );
}

function getOutermostChainCall(node: TSESTree.CallExpression): TSESTree.CallExpression {
  let current: TSESTree.Node = node;
  while (current.parent) {
    if (
      current.parent.type === "MemberExpression" &&
      current.parent.object === current
    ) {
      if (
        current.parent.parent?.type === "CallExpression" &&
        current.parent.parent.callee === current.parent
      ) {
        current = current.parent.parent;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return current as TSESTree.CallExpression;
}

function isTerminalChain(outermost: TSESTree.CallExpression): boolean {
  return (
    outermost.callee.type === "MemberExpression" &&
    outermost.callee.property.type === "Identifier" &&
    TERMINAL_METHODS.has(outermost.callee.property.name)
  );
}

const ROUTER_FUNCTIONS = new Set(["createRouter"]);

function isRouterCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === "Identifier" &&
    ROUTER_FUNCTIONS.has(node.callee.name)
  );
}

export default createRule<Options, MessageIds>({
  name: "no-router-chain",
  meta: {
    type: "problem",
    docs: {
      description:
        "createRouter() must be standalone; createEndpoint() chains must end with a terminal method (.get/.post/.put/.delete).",
    },
    schema: [],
    messages: {
      routerChain:
        "Do not chain methods on createRouter(). Create the router as a standalone declaration and apply middleware on individual endpoints via createEndpoint().",
      incompleteEndpointChain:
        "createEndpoint() chain must end with a terminal method (.get, .post, .put, .delete). The current chain ends with '{{method}}' and would export a partial builder instead of registering a route.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (!isCreateEndpointCall(node)) {
          if (isRouterCall(node)) {
            const parent = node.parent;
            if (parent.type === "MemberExpression" && !parent.optional) {
              context.report({
                node,
                messageId: "routerChain",
              });
            }
          }
          return;
        }

        const outermost = getOutermostChainCall(node);

        if (isTerminalChain(outermost)) return;

        const methodName =
          outermost.callee.type === "MemberExpression" &&
          outermost.callee.property.type === "Identifier"
            ? outermost.callee.property.name
            : "(none)";

        context.report({
          node: outermost,
          messageId: "incompleteEndpointChain",
          data: { method: methodName },
        });
      },
    };
  },
});
