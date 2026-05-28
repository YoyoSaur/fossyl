import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { Type, TypeChecker, TypeFlags } from "typescript";
import { createRule } from "../utils/rule-factory";

export type MessageIds = "bareThrow";

export type Options = [];

const HTTP_METHOD_NAMES = new Set(["get", "post", "put", "delete"]);
const HANDLER_PROPERTY_NAMES = new Set([
  "handler",
  "validator",
  "authenticator",
  "queryValidator",
  "urlParamValidator",
  "responseValidator",
]);

function isHandlerContext(node: TSESTree.Node): boolean {
  if (
    node.type === "Property" &&
    node.key.type === "Identifier" &&
    HANDLER_PROPERTY_NAMES.has(node.key.name)
  ) {
    return true;
  }
  return false;
}

function isMethodChainCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier" &&
    HTTP_METHOD_NAMES.has(node.callee.property.name)
  );
}

function getEnclosingFunction(
  node: TSESTree.Node
): TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | null {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function isInsideRouteHandler(node: TSESTree.ThrowStatement): boolean {
  const fn = getEnclosingFunction(node);
  if (!fn) return false;

  if (fn.parent && isHandlerContext(fn.parent)) return true;

  if (
    fn.parent?.type === "Property" &&
    fn.parent.parent?.type === "ObjectExpression"
  ) {
    const objParent = fn.parent.parent.parent;
    if (objParent?.type === "CallExpression" && isMethodChainCall(objParent)) {
      return true;
    }
  }

  if (fn.parent?.type === "CallExpression" && isMethodChainCall(fn.parent)) {
    return true;
  }

  return false;
}

function hasFossylBrand(type: Type, checker: TypeChecker): boolean {
  if (type.symbol?.getName() === "FossylError") return true;

  const aliasName = (type as any).aliasSymbol?.getName();
  if (aliasName === "FossylError") return true;

  if (type.isUnion()) {
    return type.types.every((t) => hasFossylBrand(t, checker));
  }

  const fossylProp = type.getProperty("__fossyl");
  return fossylProp !== undefined;
}

export default createRule<Options, MessageIds>({
  name: "no-bare-throw",
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that throw statements in route handlers use a FossylError type.",
    },
    schema: [],
    messages: {
      bareThrow:
        "Thrown value must be a FossylError. Use fossylError() or a named constructor (fossylNotFound, fossylValidationError, etc.) in route handlers.",
    },
  },
  defaultOptions: [],
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      ThrowStatement(node: TSESTree.ThrowStatement): void {
        if (!node.argument) return;
        if (!isInsideRouteHandler(node)) return;

        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.argument);
        if (!tsNode) return;

        const type = checker.getTypeAtLocation(tsNode);

        if (hasFossylBrand(type, checker)) return;

        context.report({
          node,
          messageId: "bareThrow",
        });
      },
    };
  },
});
