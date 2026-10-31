import test from "node:test";
import assert from "node:assert/strict";
import { internalPreviewLogin } from "../lib/security";
test("internal login is enabled only in the explicitly selected Vercel preview", () => {
  process.env.INTERNAL_TEST_MODE = "1";
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_GIT_COMMIT_REF = "improve/mavro-advisor-verified-workflow";
  assert.equal(internalPreviewLogin(), true);
  process.env.VERCEL_ENV = "production";
  assert.equal(internalPreviewLogin(), false);
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_GIT_COMMIT_REF = "main";
  assert.equal(internalPreviewLogin(), false);
  process.env.VERCEL_GIT_COMMIT_REF = "improve/mavro-advisor-verified-workflow";
  delete process.env.VERCEL;
  assert.equal(internalPreviewLogin(), false);
});
