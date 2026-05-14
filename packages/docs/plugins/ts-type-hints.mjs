import { definePlugin, AttachedPluginData } from '@expressive-code/core';
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const typeHintData = new AttachedPluginData(() => new Map());

const SYNTAX_COLORS = {
  keyword: '#F8846E',
  type: '#DE953D',
  string: '#A3B18A',
  number: '#F18B2F',
  punctuation: '#E8C547',
};

const TS_KEYWORDS = new Set([
  'true', 'false', 'null', 'undefined', 'never', 'any', 'unknown',
  'readonly', 'keyof', 'extends', 'infer', 'typeof', 'as', 'satisfies',
  'void',
]);

const TS_PRIMITIVES = new Set([
  'string', 'number', 'boolean', 'bigint', 'symbol',
]);

const TS_BUILTINS = new Set([
  'Promise', 'Array', 'Record', 'Partial', 'Required', 'Readonly',
  'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable',
  'ReturnType', 'Parameters', 'ConstructorParameters',
  'InstanceType', 'ThisType', 'OmitThisParameter',
  'Error', 'Map', 'Set', 'WeakMap', 'WeakSet',
]);

function tokenizeType(src) {
  const tokens = [];
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b\w+\b|[^\w\s]|\s+)/g;
  let m;
  while ((m = re.exec(src))) {
    const t = m[0];
    if (/^\s+$/.test(t)) {
      tokens.push(t);
    } else if (/^["'`]/.test(t)) {
      tokens.push([t, SYNTAX_COLORS.string]);
    } else if (/^\d/.test(t)) {
      tokens.push([t, SYNTAX_COLORS.number]);
    } else if (TS_KEYWORDS.has(t)) {
      tokens.push([t, SYNTAX_COLORS.keyword]);
    } else if (TS_PRIMITIVES.has(t)) {
      tokens.push([t, SYNTAX_COLORS.type]);
    } else if (/^[{}()\[\];:,.<>=&|!?+\-*/%^~@]$/.test(t)) {
      tokens.push([t, SYNTAX_COLORS.punctuation]);
    } else {
      tokens.push(t);
    }
  }
  return tokens;
}

let compilerHost = null;
let compilerOptions = null;

function getCompilerSetup() {
  if (compilerOptions) return { host: compilerHost, options: compilerOptions };

  const coreDist = path.resolve(__dirname, '../../core/dist/index.d.ts');
  const libDir = path.dirname(path.dirname(new URL(import.meta.resolve('typescript')).pathname));

  compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    lib: ['lib.esnext.d.ts'],
    paths: {
      'fossyl': [coreDist],
    },
    baseUrl: path.dirname(coreDist),
    allowJs: false,
    types: [],
  };

  compilerHost = ts.createCompilerHost(compilerOptions, true);
  const originalResolveModule = compilerHost.resolveModuleNames?.bind(compilerHost);
  const originalFileExists = compilerHost.fileExists.bind(compilerHost);

  compilerHost.resolveModuleNames = (moduleNames, containingFile) => {
    return moduleNames.map((name) => {
      if (name === 'fossyl') {
        const result = ts.resolveModuleName(name, containingFile, compilerOptions, {
          fileExists: originalFileExists,
          readFile: compilerHost.readFile.bind(compilerHost),
        });
        if (result.resolvedModule) return result.resolvedModule;
        return {
          resolvedFileName: coreDist,
          extension: ts.Extension.Dts,
          isExternalLibraryImport: true,
        };
      }
      if (originalResolveModule) {
        const results = originalResolveModule([name], containingFile);
        return results?.[0] ?? undefined;
      }
      return undefined;
    });
  };

  compilerHost.fileExists = (fileName) => {
    if (fileName === coreDist) return true;
    return originalFileExists(fileName);
  };

  return { host: compilerHost, options: compilerOptions };
}

function extractTypes(code) {
  const types = new Map();

  try {
    const { host, options } = getCompilerSetup();
    const fileName = '/virtual/code-block.ts';
    const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext, true);

    const customHost = {
      ...host,
      getSourceFile: (name, languageVersion) => {
        if (name === fileName) return sourceFile;
        return host.getSourceFile(name, languageVersion);
      },
      getDefaultLibFileName: (opts) => host.getDefaultLibFileName(opts),
      getCurrentDirectory: () => host.getCurrentDirectory(),
      getCanonicalFileName: (f) => host.getCanonicalFileName(f),
      useCaseSensitiveFileNames: () => host.useCaseSensitiveFileNames(),
      getNewLine: () => host.getNewLine(),
      fileExists: (f) => f === fileName || host.fileExists(f),
      readFile: (f) => f === fileName ? code : host.readFile(f),
      writeFile: () => {},
    };

    const program = ts.createProgram([fileName], options, customHost);
    const checker = program.getTypeChecker();

    collectTypes(sourceFile, checker, types, program);
  } catch (e) {
    // Silently skip — type hints are best-effort
  }

  return types;
}

const skipTypes = new Set(['ErrorConstructor', 'PromiseConstructor', 'ArrayConstructor', 'ObjectConstructor', 'FunctionConstructor', 'BooleanConstructor', 'StringConstructor', 'NumberConstructor']);

function decodeEntities(str) {
  return str.replace(/&#x22;/g, '"').replace(/&#x27;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

function collectTypes(node, checker, types, program) {
  if (ts.isIdentifier(node) && !isImportOrModuleSpecifier(node)) {
    try {
      const symbol = checker.getSymbolAtLocation(node);
      if (symbol) {
        const type = checker.getTypeOfSymbolAtLocation(symbol, node);
        let typeString = checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation);
        typeString = decodeEntities(typeString);
        if (typeString && typeString !== 'any' && typeString !== 'unknown' && !skipTypes.has(typeString) && !typeString.startsWith('typeof ')) {
          // Expand non-generic type aliases to show their definition
          if (type.aliasSymbol) {
            try {
              const decl = type.aliasSymbol.declarations?.[0];
              if (decl && ts.isTypeAliasDeclaration(decl) && (!decl.typeParameters || decl.typeParameters.length === 0)) {
                const sourceFile = decl.getSourceFile();
                const expanded = sourceFile.text.slice(decl.type.pos, decl.type.end);
                if (expanded && !expanded.startsWith(type.aliasSymbol.name)) {
                  typeString = `${type.aliasSymbol.name} = ${expanded}`;
                }
              }
            } catch {}
          }
          const name = node.text;
          const existing = types.get(name);
          const hasExpansion = typeString.includes(' = ');
          const existingHasExpansion = existing?.includes(' = ') ?? false;
          if (!existing || (hasExpansion && !existingHasExpansion) || (!hasExpansion && !existingHasExpansion && typeString.length < existing.length)) {
            types.set(name, typeString);
          }
        }
      }
    } catch {
      // skip nodes that can't be typed
    }
  }

  ts.forEachChild(node, (child) => collectTypes(child, checker, types, program));
}

function isImportOrModuleSpecifier(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isImportSpecifier(parent) || ts.isNamespaceImport(parent) || ts.isImportClause(parent)) {
    return true;
  }
  if (ts.isExternalModuleReference(parent) && parent.expression === node) return true;
  if (ts.isExportSpecifier(parent)) return true;
  return false;
}

async function formatWithPrettier(types) {
  const entries = [...types.entries()];
  if (entries.length === 0) return types;

  const aliasPrefixRe = /^(\w+ )?= /;
  const rawLines = entries.map(([name, raw], i) => {
    const clean = raw.replace(/import\("[^"]+"\)\./g, '');
    return { name, raw: clean, i };
  });

  const formattedTypes = await Promise.all(rawLines.map(async ({ name, raw, i }) => {
    const aliasMatch = raw.match(aliasPrefixRe);
    let valueToFormat;
    let aliasPart;
    if (aliasMatch) {
      aliasPart = aliasMatch[1] || '';
      valueToFormat = raw.slice(aliasMatch[0].length);
    } else {
      aliasPart = '';
      valueToFormat = raw;
    }

    try {
      const formatted = await prettier.format(`type _T = ${valueToFormat};`, { parser: 'typescript', semi: false });
      const extracted = formatted.replace(/^type _T = /, '').replace(/[;\n]+$/, '').trim();
      const final = aliasPart ? `${aliasPart}= ${extracted}` : extracted;
      return { name, value: final };
    } catch {
      return { name, value: raw };
    }
  }));

  const result = new Map();
  for (const { name, value } of formattedTypes) {
    result.set(name, value);
  }
  return result;
}

function formatTypes(types) {
  const result = new Map();
  for (const [name, text] of types) {
    const tokens = tokenizeType(text);
    result.set(name, { text, tokens });
  }
  return result;
}

export function tsTypeHints() {
  return definePlugin({
    name: 'ts-type-hints',
    hooks: {
      preprocessCode: async ({ codeBlock }) => {
        if (codeBlock.language !== 'typescript') return;
        const code = codeBlock.code;
        if (!code.includes('fossyl')) return;

        const rawTypes = extractTypes(code);
        if (rawTypes.size > 0) {
          const formatted = await formatWithPrettier(rawTypes);
          const withTokens = formatTypes(formatted);
          typeHintData.setFor(codeBlock, withTokens);
        }
      },
      postprocessRenderedLine: async ({ renderData, codeBlock }) => {
        const types = typeHintData.getOrCreateFor(codeBlock);
        if (!types || types.size === 0) return;

        annotateAst(renderData.lineAst, types);
      },
    },
  });
}

function annotateAst(node, types) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'element') {
    const children = node.children || [];
    let textContent = '';
    const textNodes = [];

    children.forEach((child, i) => {
      if (child.type === 'text') {
        textContent += child.value;
        textNodes.push({ node: child, index: i });
      }
    });

    if (textNodes.length === 1 && types.has(textContent)) {
      const { text, tokens } = types.get(textContent);
      node.properties = node.properties || {};
      node.properties['data-ts-type'] = text;

      const tooltipChildren = [];
      for (const t of tokens) {
        if (typeof t === 'string') {
          tooltipChildren.push({ type: 'text', value: t });
        } else {
          tooltipChildren.push({
            type: 'element',
            tagName: 'span',
            properties: { style: `--0:${t[1]}` },
            children: [{ type: 'text', value: t[0] }],
          });
        }
      }

      node.children = children.concat([{
        type: 'element',
        tagName: 'span',
        properties: { class: 'ts-tooltip' },
        children: tooltipChildren,
      }]);
    }
  }

  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child && child.properties?.class === 'ts-tooltip') continue;
    annotateAst(child, types);
  }
}
