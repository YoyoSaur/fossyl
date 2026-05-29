---
name: fossyl-server
description: Use when setting up an Express server in a fossyl project — middleware, error handler, adapter integration
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-server

## Overview

Express server entry point that wires middleware, routes, and error handling using `@fossyl/express`.

## Server Setup

```typescript
import express from "express";
import { fossylExpress } from "@fossyl/express";

const app = express();
app.use(express.json());

// Init fossyl express adapter
const router = fossylExpress(app);

// Register routes
import { pingRoute } from "./features/ping/routes/ping.route";
pingRoute(router);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Something went wrong" });
});

app.listen(3000, () => console.log("Server listening on :3000"));
```

## Middleware Order

1. `express.json()` — body parsing
2. `fossylExpress()` — fossyl adapter
3. Route registration
4. Error handler (last)
