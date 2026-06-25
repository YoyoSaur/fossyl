import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-factory";

const REPO_IMPORT_PATTERN = /[/\\][^/\\]*\.repo(\.[a-z]+)?$/;
const REPO_IMPORT_NO_PATH_PATTERN = /\.repo(\.[a-z]+)?$/;
const SERVICE_FILE_PATTERN = /[/\\][^/\\]*\.service(\.[a-z]+)?$/;

export type MessageIds = "repoImportOutsideService";

export type Options = [
  {
    allowImports?: string[];
  },
];

export default createRule<Options, MessageIds>({
  name: "no-repo-import-outside-service",
  meta: {
    type: "problem",
    docs: {
      description: "Repository files (*.repo) can only be imported in service files (*.service).",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowImports: {
            type: "array",
            items: { type: "string" },
            description: "Additional import paths that are allowed to import .repo files.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      repoImportOutsideService:
        "Repository files (*.repo) can only be imported in service files (*.service). Import '{{importPath}}' in '{{fileName}}' violates the service layer boundary.",
    },
  },
  defaultOptions: [{ allowImports: [] }],
  create(context, [options]) {
    const fileName = context.filename;
    const isServiceFile = SERVICE_FILE_PATTERN.test(fileName);

    function isRepoImport(sourceValue: string): boolean {
      if (REPO_IMPORT_PATTERN.test(sourceValue)) {
        return true;
      }
      if (REPO_IMPORT_NO_PATH_PATTERN.test(sourceValue) && sourceValue.includes("/")) {
        return false;
      }
      if (REPO_IMPORT_NO_PATH_PATTERN.test(sourceValue)) {
        return true;
      }
      return false;
    }

    function isAllowedImport(sourceValue: string): boolean {
      return options.allowImports?.some((allowed) => sourceValue.startsWith(allowed)) ?? false;
    }

    function checkImport(sourceValue: string, node: TSESTree.Node): void {
      if (isAllowedImport(sourceValue)) return;
      if (!isRepoImport(sourceValue)) return;
      if (isServiceFile) return;

      context.report({
        node,
        messageId: "repoImportOutsideService",
        data: {
          importPath: sourceValue,
          fileName: context.filename ?? "unknown",
        },
      });
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (node.source.type === "Literal" && typeof node.source.value === "string") {
          checkImport(node.source.value, node);
        }
      },
      ImportExpression(node: TSESTree.ImportExpression): void {
        if (node.source.type === "Literal" && typeof node.source.value === "string") {
          checkImport(node.source.value, node);
        }
      },
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration): void {
        if (
          node.source &&
          node.source.type === "Literal" &&
          typeof node.source.value === "string"
        ) {
          checkImport(node.source.value, node);
        }
      },
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        if (
          node.source &&
          node.source.type === "Literal" &&
          typeof node.source.value === "string"
        ) {
          checkImport(node.source.value, node);
        }
      },
    };
  },
});
