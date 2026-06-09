---
name: fossyl-service
description: Use when implementing service layer in a fossyl project — business logic, multi-repo composition, sub-services, error handling, external SDK adapters
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-service

## Overview

Services contain business logic between routes and repos. A service can import multiple repos and other services freely. Services never import `db` directly — data access goes through repos.

## Single-Repo Service

```typescript
import type { Auth } from "@fossyl/core";
import * as myRepo from "../repo/my.repo";
import { fossylNotFound } from "../errors";

export async function list(auth: Auth, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    myRepo.findAll(offset, pageSize),
    myRepo.countAll(),
  ]);
  return { items, total, page, pageSize, hasMore: offset + pageSize < total };
}

export async function getById(auth: Auth, id: string) {
  const item = await myRepo.findById(id);
  if (!item) throw fossylNotFound("Item not found");
  return item;
}
```

## Multi-Repo Composition

Services freely compose multiple repos to build complex responses:

```typescript
import * as userRepo from "../repo/user.repo";
import * as timesheetRepo from "../repo/timesheet.repo";
import * as payrollRepo from "../repo/payroll.repo";

export async function getEmployeeDashboard(auth: Auth, employeeId: string) {
  const [user, timesheets, payroll] = await Promise.all([
    userRepo.findById(employeeId),
    timesheetRepo.findByEmployee(employeeId),
    payrollRepo.findByEmployee(employeeId),
  ]);
  if (!user) throw fossylNotFound("Employee not found");
  return { user, timesheets, payroll };
}
```

## Service Composition (Services Calling Services)

Services can import and call other services — no special constraints:

```typescript
import * as userService from "../services/user.service";
import * as auditService from "../services/audit.service";

export async function promoteUser(auth: Auth, userId: string, role: string) {
  const user = await userService.getById(auth, userId);
  await auditService.log(auth, "promotion", { userId, role });
  return userRepo.updateRole(userId, role);
}
```

## External SDK Repos

When a repo wraps an external API (e.g. timesheets via Check SDK, payroll via Gusto), the service layer treats it identically. The repo transforms the external model into the domain model:

```typescript
// src/features/timesheets/repo/timesheet.repo.ts
import { CheckClient } from "@checkhq/sdk";

export async function findByEmployee(employeeId: string): Promise<Timesheet[]> {
  const raw = await checkClient.timesheets.list({ employeeId });
  return raw.map(mapCheckTimesheetToDomain);
}
```

The service doesn't know or care whether data comes from Kysely or an SDK call.

## Error Handling

Wrap 3rd-party errors (DB, network, SDK) into fossyl-branded errors. Never throw bare `Error`.

```typescript
import { fossylInternal, fossylNotFound } from "../errors";

export async function getById(id: string) {
  try {
    const item = await myRepo.findById(id);
    if (!item) throw fossylNotFound("Item not found");
    return item;
  } catch (e) {
    if (isFossylError(e)) throw e;
    throw fossylInternal("Database error");
  }
}
```

## Dependencies

- Import `../repo/<name>.repo` — never import `db` directly
- Import `../services/<name>.service` — compose other services freely
- Import `../errors` for error creators
- Import `@fossyl/core` for types only (`Auth`, `Response`, etc.)
