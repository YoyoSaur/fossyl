// @code-block-start: agents-md
<!-- Each fossyl package ships with an AGENTS.md file
  that tells AI assistants how to work with the codebase. -->

<!-- @fossyl/core/AGENTS.md tells AI: -->
# @fossyl/core - Contributor Guide

## DO NOT MODIFY THIS PACKAGE

The core is deliberately protected because:
- Function overloads are carefully ordered for type inference
- Branded types enable inference without explicit generics
- Route type unions enforce REST semantics at compile-time

## What AI CAN Do
- Read core to write correct adapter code
- Use the types to build adapters and services
- Reference USAGE.md for API patterns

<!-- @fossyl/express/AGENTS.md tells AI: -->
# @fossyl/express - Contributor Guide

> **AI Collaboration:** Green Zone — contributions welcome!

The Express adapter implements the FrameworkAdapter interface
and handles route registration, request context, and error formatting.

<!-- Generated projects also get a CLAUDE.md with project-specific context -->
<!-- @code-block-end: agents-md -->
