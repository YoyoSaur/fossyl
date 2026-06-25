import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-factory";

export type MessageIds = "noRawSql";
export type Options = [{ allowlist?: string[] }];

const REPO_FILE_PATTERN = /[/\\][^/\\]*\.repo(\.[a-z]+)?$/;

export default createRule<Options, MessageIds>({
  name: "no-raw-sql",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Discourage sql.raw() in favor of Kysely query builder methods.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowlist: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noRawSql:
        "sql.raw() usage detected with '{{rawContent}}'. Prefer Kysely query builder methods for type safety and composability. If raw SQL is required, add this usage context to the rule's allowlist.",
    },
  },
  defaultOptions: [{ allowlist: [] }],
  create(context, [options]) {
    const fileName = context.filename;
    if (!REPO_FILE_PATTERN.test(fileName)) return {};

    const allowlist = options.allowlist ?? [];
    if (allowlist.some((entry) => fileName.includes(entry))) return {};

    let currentFunctionName: string | null = null;

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.id?.type === "Identifier") currentFunctionName = node.id.name;
      },
      "FunctionDeclaration:exit"(): void {
        currentFunctionName = null;
      },
      CallExpression(node: TSESTree.CallExpression): void {
        if (currentFunctionName && allowlist.includes(currentFunctionName)) return;

        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "sql" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "raw"
        ) {
          const rawContent =
            node.arguments.length > 0 &&
            node.arguments[0].type === "Literal" &&
            typeof node.arguments[0].value === "string"
              ? node.arguments[0].value
              : "<dynamic>";
          context.report({
            node,
            messageId: "noRawSql",
            data: { rawContent: rawContent.substring(0, 80) },
          });
        }
      },
    };
  },
});
