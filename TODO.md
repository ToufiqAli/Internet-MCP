# Fix Winston Logger for Serverless Environments

## Problem
Winston logger fails in AWS Lambda/serverless environments because it tries to create `logs/` directory, but the filesystem is read-only except for `/tmp/`.

## Solution
Make logger environment-aware to disable File transports in production/serverless.

## Tasks
- [x] Analyze the issue and understand the logger configuration
- [x] Update `utils/logger.js` to detect serverless environment
- [x] Disable File transports in production/serverless (keep Console only)
- [x] Maintain backward compatibility for local development

## Implementation Details
- Detect AWS Lambda via `AWS_EXECUTION_ENV` or `LAMBDA_TASK_ROOT` env vars
- Use Console-only transport in serverless environments
- Keep full logging (Console + File) in development
