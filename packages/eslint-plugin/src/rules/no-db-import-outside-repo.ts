import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/rule-factory";
import path from "node:path";

const REPO_FILE_PATTERN = /[/\\][^/\\]*\.repo(\.[a-z]+)?$/;

/**
 * Patterns for local database module imports.
 * - Relative paths ending in `/db` (e.g. `../../db`, `./db`)
 * - The `@db` tsconfig path alias
 */
const DB_SOURCE_PATTERNS = [
  /\/db$/,
  /\/db\.\w+$/,
  /^@db$/,
];

function isDbImport(sourceValue: string): boolean {
  return DB_SOURCE_PATTERNS.some((pattern) => pattern.test(sourceValue));
}

function isRepoFile(fileName: string): boolean {
  return REPO_FILE_PATTERN.test(fileName);
}

export type MessageIds = "dbImportOutsideRepo";

export type Options = [
  {
    allowFiles?: string[];
  },
];

export default createRule<Options, MessageIds>({
  name: "no-db-import-outside-repo",
  meta: {
    type: "problem",
    docs: {
      description:
        "Database module can only be imported in repository files (*.repo.ts). Services, routes, and other layers must access data through repos.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowFiles: {
            type: "array",
            items: { type: "string" },
            description:
              "Additional file basename patterns allowed to import the db module (e.g. 'index.ts', 'migrate.ts').",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      dbImportOutsideRepo:
        "Database module should only be imported in repository files (*.repo.ts). Import '{{importPath}}' in '{{fileName}}' bypasses the repo layer.",
    },
  },
  defaultOptions: [{ allowFiles: [] }],
  create(context, [options]) {
    const fileName = context.filename;
    const fileNameBasename = path.basename(fileName);

    function isAllowedFile(): boolean {
      if (isRepoFile(fileName)) return true;
      return options.allowFiles?.some((allowed) => fileNameBasename === allowed) ?? false;
    }

    function checkImport(sourceValue: string, node: TSESTree.Node): void {
      if (!isDbImport(sourceValue)) return;
      if (isAllowedFile()) return;

      context.report({
        node,
        messageId: "dbImportOutsideRepo",
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
