import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-factory";
import path from "node:path";
import fs from "node:fs";

const ROUTE_FILE_PATTERN = /[/\\]features[/\\][^/\\]+[/\\][^/\\]*\.route(\.[a-z]+)?$/;

export type MessageIds = "unregisteredRoute";
export type Options = [];

export default createRule<Options, MessageIds>({
  name: "no-unregistered-route",
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that every route file's default export is imported in registry.ts",
    },
    schema: [],
    messages: {
      unregisteredRoute:
        "Route file '{{filePath}}' exports a default route array but is not imported in src/registry.ts. Run 'fossyl register' to regenerate.",
    },
  },
  defaultOptions: [],
  create(context) {
    const fileName = context.filename;
    const isRouteFile = ROUTE_FILE_PATTERN.test(fileName);

    if (!isRouteFile) return {};

    const projectRoot = process.cwd();
    const relativeToRoot = path.relative(projectRoot, fileName);
    const importSpecifier = "./" + relativeToRoot.replace(/\\/g, "/").replace(/\.tsx?$/, "");
    let hasDefaultExport = false;

    return {
      ExportDefaultDeclaration(node: TSESTree.ExportDefaultDeclaration): void {
        if (
          node.declaration.type === "ArrayExpression" ||
          node.declaration.type === "Identifier"
        ) {
          hasDefaultExport = true;
        }
      },
      "Program:exit"() {
        if (!hasDefaultExport) return;

        const registryPath = path.join(projectRoot, "src", "registry.ts");
        let registryContent: string;
        try {
          registryContent = fs.readFileSync(registryPath, "utf-8");
        } catch {
          context.report({
            node: context.sourceCode.ast,
            messageId: "unregisteredRoute",
            data: { filePath: fileName },
          });
          return;
        }

        if (!registryContent.includes(importSpecifier)) {
          context.report({
            node: context.sourceCode.ast,
            messageId: "unregisteredRoute",
            data: { filePath: fileName },
          });
        }
      },
    };
  },
});
