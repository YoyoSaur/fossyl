import type { TSESTree } from '@typescript-eslint/utils';
import path from 'node:path';

export interface CollectedRoute {
  filePath: string;
  method: string;
  fullPath: string;
  basePrefix: string | null;
  createEndpointNode: TSESTree.CallExpression;
  createEndpointLine: number;
}

export interface FileRoutes {
  filePath: string;
  basePrefix: string | null;
  routes: CollectedRoute[];
}

class RouteCollectorStore {
  private routesByFile: Map<string, FileRoutes> = new Map();

  reset(): void {
    this.routesByFile.clear();
  }

  addRoute(filePath: string, route: CollectedRoute): void {
    const existing = this.routesByFile.get(filePath);
    if (existing) {
      existing.routes.push(route);
    } else {
      this.routesByFile.set(filePath, {
        filePath,
        basePrefix: route.basePrefix,
        routes: [route],
      });
    }
  }

  setBasePrefix(filePath: string, prefix: string): void {
    const existing = this.routesByFile.get(filePath);
    if (existing) {
      existing.basePrefix = prefix;
    } else {
      this.routesByFile.set(filePath, {
        filePath,
        basePrefix: prefix,
        routes: [],
      });
    }
  }

  getRoutesForFile(filePath: string): FileRoutes | undefined {
    return this.routesByFile.get(filePath);
  }

  getAllRoutes(): FileRoutes[] {
    return Array.from(this.routesByFile.values());
  }

  findDuplicates(): { method: string; path: string; occurrences: CollectedRoute[] }[] {
    const routeMap = new Map<string, CollectedRoute[]>();
    const duplicates: { method: string; path: string; occurrences: CollectedRoute[] }[] = [];

    for (const fileRoutes of this.routesByFile.values()) {
      for (const route of fileRoutes.routes) {
        const key = `${route.method} ${route.fullPath}`;
        const existing = routeMap.get(key);
        if (existing) {
          existing.push(route);
        } else {
          routeMap.set(key, [route]);
        }
      }
    }

    for (const [key, occurrences] of routeMap.entries()) {
      if (occurrences.length > 1) {
        const [method, ...pathParts] = key.split(' ');
        duplicates.push({ method, path: pathParts.join(' '), occurrences });
      }
    }

    return duplicates;
  }
}

export const routeStore = new RouteCollectorStore();

export interface RouteInfo {
  method: string;
  path: string;
  node: TSESTree.CallExpression;
}

export function getRouteInfo(node: TSESTree.CallExpression): RouteInfo | null {
  if (
    node.callee.type !== 'MemberExpression' ||
    node.callee.property.type !== 'Identifier'
  ) return null;

  const validMethods = ['get', 'post', 'put', 'delete', 'list'];
  if (!validMethods.includes(node.callee.property.name)) return null;

  const object = node.callee.object;
  if (
    object.type !== 'CallExpression' ||
    object.callee.type !== 'MemberExpression' ||
    object.callee.property.type !== 'Identifier' ||
    object.callee.property.name !== 'createEndpoint'
  ) return null;

  const arg = object.arguments[0];
  if (!arg || arg.type !== 'Literal' || typeof arg.value !== 'string') return null;

  return {
    method: node.callee.property.name.toUpperCase(),
    path: arg.value,
    node,
  };
}

export function getEndpointPath(node: TSESTree.CallExpression): string | null {
  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'createEndpoint'
  ) {
    const arg = node.arguments[0];
    if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
      return arg.value;
    }
  }
  return null;
}

export function getMethodFromEndpointCall(node: TSESTree.CallExpression): string | null {
  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier'
  ) {
    const method = node.callee.property.name;
    const validMethods = ['get', 'post', 'put', 'delete', 'list'];
    if (validMethods.includes(method)) {
      return method.toUpperCase();
    }
  }
  return null;
}

export function getCreateRouterPrefix(node: TSESTree.CallExpression): string | null {
  if (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'createRouter'
  ) {
    const arg = node.arguments[0];
    if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
      return arg.value;
    }
  }
  return null;
}

export function getRelativeFilePath(absolutePath: string): string {
  const cwd = process.cwd();
  const relative = path.relative(cwd, absolutePath);
  return relative.replace(/\\/g, '/');
}
