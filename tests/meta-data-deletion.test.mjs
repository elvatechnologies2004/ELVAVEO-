import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

const {
  parseAndVerifyMetaSignedRequest,
  createMetaSignedRequest,
  recordAndExecuteMetaDeletion,
  getMetaDeletionRecord,
  saveMetaDeletionRecord,
  updateMetaDeletionStatus,
  isValidConfirmationCode,
  generateAlphanumericConfirmationCode,
  hashUserId,
  computeUserHash,
  getCandidateUserHashes,
  matchesUserId,
  isTestIdentity,
  resetMetaDataDeletionRateLimits,
  checkMetaDataDeletionRateLimit,
  handleMetaDataDeletionPost,
  handleMetaDataDeletionGet,
} = await import("../lib/metaDataDeletion.ts");

const TEST_SECRET = "super_secret_meta_app_secret_1234567890";
process.env.META_APP_SECRET = TEST_SECRET;
process.env.SITE_URL = "https://elvaveo.com";

// ============================================================================
// META SIGNED REQUEST HMAC-SHA256 TESTS
// ============================================================================

test("Meta Signed Request: Valid signature verification succeeds", () => {
  const payload = {
    algorithm: "HMAC-SHA256",
    issued_at: Math.floor(Date.now() / 1000),
    user_id: "meta_user_1001",
  };

  const signedRequest = createMetaSignedRequest(payload, TEST_SECRET);
  const result = parseAndVerifyMetaSignedRequest(signedRequest, TEST_SECRET);

  assert.equal(result.userId, "meta_user_1001");
  assert.equal(result.algorithm, "HMAC-SHA256");
  assert.equal(result.issuedAt, payload.issued_at);
});

test("Meta Signed Request: Invalid signature with wrong secret is rejected", () => {
  const payload = {
    algorithm: "HMAC-SHA256",
    issued_at: Math.floor(Date.now() / 1000),
    user_id: "meta_user_1001",
  };

  const signedRequest = createMetaSignedRequest(payload, "wrong_secret");

  assert.throws(
    () => {
      parseAndVerifyMetaSignedRequest(signedRequest, TEST_SECRET);
    },
    /Invalid signature/
  );
});

test("Meta Signed Request: Tampered payload is rejected", () => {
  const payload = {
    algorithm: "HMAC-SHA256",
    issued_at: Math.floor(Date.now() / 1000),
    user_id: "meta_user_original",
  };

  const signedRequest = createMetaSignedRequest(payload, TEST_SECRET);
  const [sig] = signedRequest.split(".");

  // Tamper with payload by changing user_id
  const tamperedPayload = Buffer.from(
    JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "meta_user_attacker" })
  ).toString("base64url");
  const tamperedSignedRequest = `${sig}.${tamperedPayload}`;

  assert.throws(
    () => {
      parseAndVerifyMetaSignedRequest(tamperedSignedRequest, TEST_SECRET);
    },
    /Invalid signature/
  );
});

test("Meta Signed Request: Unsupported algorithm is rejected", () => {
  const payload = {
    algorithm: "MD5",
    user_id: "meta_user_1001",
  };

  const signedRequest = createMetaSignedRequest(payload, TEST_SECRET);

  assert.throws(
    () => {
      parseAndVerifyMetaSignedRequest(signedRequest, TEST_SECRET);
    },
    /Unsupported algorithm/
  );
});

test("Meta Signed Request: Missing or empty user_id is rejected", () => {
  const payload = {
    algorithm: "HMAC-SHA256",
    user_id: "",
  };

  const signedRequest = createMetaSignedRequest(payload, TEST_SECRET);

  assert.throws(
    () => {
      parseAndVerifyMetaSignedRequest(signedRequest, TEST_SECRET);
    },
    /user_id/
  );
});

test("Meta Signed Request: Malformed signed_request without dot is rejected", () => {
  assert.throws(
    () => {
      parseAndVerifyMetaSignedRequest("not_a_valid_signed_request", TEST_SECRET);
    },
    /Malformed signed_request/
  );
});

// ============================================================================
// CONFIRMATION CODE STRICT ALPHANUMERIC GENERATION & COMPATIBILITY
// ============================================================================

test("Confirmation Code: Generated codes are strictly alphanumeric and cryptographically secure", () => {
  for (let i = 0; i < 20; i++) {
    const code = generateAlphanumericConfirmationCode(32);
    assert.equal(code.length, 32);
    // Must be strictly alphanumeric (no underscores, hyphens, or special symbols)
    assert.match(code, /^[A-Z0-9]{32}$/);
    assert.equal(isValidConfirmationCode(code), true);
  }
});

test("Confirmation Code: Migration backwards compatibility supports legacy meta_del_ format", () => {
  const legacyCode = "meta_del_f2cdf77a849f7e8c57e8185f49a47dfc";
  assert.equal(isValidConfirmationCode(legacyCode), true);

  // New strictly alphanumeric codes are also valid
  assert.equal(isValidConfirmationCode("7F3A9C8D2E1B4F5A6D7C8E9B0A1C2D3E"), true);
  assert.equal(isValidConfirmationCode("A1B2C3D4E5F6G7H8"), true);

  // Invalid codes remain rejected
  assert.equal(isValidConfirmationCode(""), false);
  assert.equal(isValidConfirmationCode("short"), false);
  assert.equal(isValidConfirmationCode("with spaces in code"), false);
  assert.equal(isValidConfirmationCode("<script>"), false);
});

// ============================================================================
// DATA MINIMIZATION & RETAINED RECORDS
// ============================================================================

test("Data Minimization: Raw user ID is hashed and not retained in plaintext permanently", async () => {
  const rawUserId = `privacy_user_${Date.now()}`;
  const expectedHash = hashUserId(rawUserId);

  const result = await recordAndExecuteMetaDeletion(rawUserId);
  assert.ok(result.confirmationCode);
  // Stored record holds the non-reversible SHA-256 hash
  assert.equal(result.record.userIdHash, expectedHash);
  // Raw userId is nullified for privacy compliance
  assert.equal(result.record.userId, null);

  // Verification lookup works without exposing raw user ID
  const fetched = await getMetaDeletionRecord(result.confirmationCode);
  assert.ok(fetched);
  assert.equal(fetched.userIdHash, expectedHash);
  assert.equal(fetched.userId, null);
});

// ============================================================================
// CONCURRENCY & IDEMPOTENCY TESTS
// ============================================================================

test("Concurrency: Simultaneous duplicate requests return the same confirmation code without race conditions", async () => {
  const concurrentUserId = `concurrent_user_${Date.now()}_${Math.random()}`;

  // Execute two identical requests simultaneously via Promise.all
  const [res1, res2] = await Promise.all([
    recordAndExecuteMetaDeletion(concurrentUserId),
    recordAndExecuteMetaDeletion(concurrentUserId),
  ]);

  assert.equal(res1.confirmationCode, res2.confirmationCode);
  assert.ok(res1.isRepeat || res2.isRepeat);
});

test("Idempotency: Sequential duplicate requests return the same confirmation code", async () => {
  const sequentialUserId = `sequential_user_${Date.now()}`;

  const res1 = await recordAndExecuteMetaDeletion(sequentialUserId);
  const res2 = await recordAndExecuteMetaDeletion(sequentialUserId);

  assert.equal(res1.isRepeat, false);
  assert.equal(res2.isRepeat, true);
  assert.equal(res1.confirmationCode, res2.confirmationCode);
});

test("Meta Data Deletion: Different users receive distinct confirmation codes", async () => {
  const userA = `user_a_${Date.now()}`;
  const userB = `user_b_${Date.now()}`;

  const resA = await recordAndExecuteMetaDeletion(userA);
  const resB = await recordAndExecuteMetaDeletion(userB);

  assert.notEqual(resA.confirmationCode, resB.confirmationCode);
});

test("Expired Lease Recovery: Expired processing lease is reclaimed and completed with same confirmation code", async () => {
  const expiredUserId = `expired_lease_user_${Date.now()}`;
  const expiredCode = generateAlphanumericConfirmationCode(32);
  const userHash = hashUserId(expiredUserId);

  // Seed an expired lease (lockedUntil is 10 minutes in the past)
  await saveMetaDeletionRecord({
    confirmationCode: expiredCode,
    userIdHash: userHash,
    userId: null,
    status: "processing",
    requestedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    completedAt: null,
    lockedUntil: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    source: "crashed_worker",
    details: { scope: "elvaveo_social_media_manager" },
  });

  // Next callback arrives for that user -> should reclaim lease and finish
  const res = await recordAndExecuteMetaDeletion(expiredUserId);

  // Must reuse the exact same confirmation code
  assert.equal(res.confirmationCode, expiredCode);
  assert.equal(res.record.status, "completed");
  assert.equal(res.record.lockedUntil, null);
  assert.ok(res.record.completedAt);
});

test("Failed Deletion Retry: Failed deletion request is safely reclaimed and successfully completed", async () => {
  const failedUserId = `failed_retry_user_${Date.now()}`;
  const failedCode = generateAlphanumericConfirmationCode(32);
  const userHash = hashUserId(failedUserId);

  // Seed a failed deletion record
  await saveMetaDeletionRecord({
    confirmationCode: failedCode,
    userIdHash: userHash,
    userId: null,
    status: "failed",
    requestedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    completedAt: null,
    lockedUntil: null,
    source: "meta_callback",
    details: { error: "Simulated prior downstream API failure" },
  });

  // Retry callback arrives -> should reclaim the failed request and retry
  const res = await recordAndExecuteMetaDeletion(failedUserId);

  assert.equal(res.confirmationCode, failedCode);
  assert.equal(res.record.status, "completed");
  assert.ok(res.record.completedAt);
});

test("Hash Versioning: HMAC-SHA256 returns explicit v2 version and throws if secrets missing in production", () => {
  const testId = "meta_test_user_hash_version";

  // When secret is available: returns v2-hmac-sha256
  const hashInfo = computeUserHash(testId, TEST_SECRET);
  assert.equal(hashInfo.version, "v2-hmac-sha256");
  assert.equal(hashInfo.hash.length, 64);

  // In production, missing secrets must throw explicitly rather than silently degrading
  const originalEnv = process.env.NODE_ENV;
  const originalAppSecret = process.env.META_APP_SECRET;
  const originalHashSecret = process.env.META_DELETION_HASH_SECRET;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.META_APP_SECRET;
    delete process.env.META_DELETION_HASH_SECRET;

    assert.throws(
      () => computeUserHash(testId),
      /Server misconfiguration: META_DELETION_HASH_SECRET or META_APP_SECRET is required/
    );
  } finally {
    process.env.NODE_ENV = originalEnv;
    process.env.META_APP_SECRET = originalAppSecret;
    if (originalHashSecret) process.env.META_DELETION_HASH_SECRET = originalHashSecret;
  }
});

test("Key Rotation: Matches previous secret during rotation grace period without orphaning records", async () => {
  const rotationUserId = `rotation_user_${Date.now()}`;
  const oldSecret = "old_legacy_secret_key_987654321";
  const newSecret = "new_hardened_secret_key_123456789";

  // Record created under old secret
  const oldHash = crypto.createHmac("sha256", oldSecret).update(rotationUserId).digest("hex");
  const oldCode = generateAlphanumericConfirmationCode(32);

  await saveMetaDeletionRecord({
    confirmationCode: oldCode,
    userIdHash: oldHash,
    hashVersion: "v2-hmac-sha256-rotated",
    userId: null,
    status: "completed",
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    source: "meta_callback",
  });

  // System is rotated to newSecret as active, and oldSecret as previous
  const originalHashSecret = process.env.META_DELETION_HASH_SECRET;
  const originalPrevSecret = process.env.META_DELETION_HASH_SECRET_PREVIOUS;

  try {
    process.env.META_DELETION_HASH_SECRET = newSecret;
    process.env.META_DELETION_HASH_SECRET_PREVIOUS = oldSecret;

    // Incoming callback for the user must match the old record and return oldCode
    const res = await recordAndExecuteMetaDeletion(rotationUserId);
    assert.equal(res.confirmationCode, oldCode);
    assert.equal(res.isRepeat, true);
  } finally {
    process.env.META_DELETION_HASH_SECRET = originalHashSecret;
    process.env.META_DELETION_HASH_SECRET_PREVIOUS = originalPrevSecret;
  }
});

test("Migration Preservation: Historical unkeyed v1-sha256 records remain resolvable without data loss", async () => {
  const legacyUserId = `legacy_v1_user_${Date.now()}`;
  const legacySha256 = crypto.createHash("sha256").update(legacyUserId).digest("hex");
  const legacyCode = "meta_del_f8e7d6c5b4a392011029384756abcdef";

  await saveMetaDeletionRecord({
    confirmationCode: legacyCode,
    userIdHash: legacySha256,
    hashVersion: "v1-sha256",
    userId: null,
    status: "completed",
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    source: "meta_callback_legacy",
  });

  // Verify that record is identified as an idempotent hit under current v2 system
  const res = await recordAndExecuteMetaDeletion(legacyUserId);
  assert.equal(res.confirmationCode, legacyCode);
  assert.equal(res.isRepeat, true);

  // Status check lookup also works
  const record = await getMetaDeletionRecord(legacyCode);
  assert.ok(record);
  assert.equal(record.confirmationCode, legacyCode);
  assert.equal(record.status, "completed");
});

// ============================================================================
// PRODUCTION TEST SAFETY SAFEGUARDS
// ============================================================================

test("Test Safety: Test identities trigger non-destructive scoped execution", async () => {
  const testUserId = `test_compliance_reviewer_${Date.now()}`;
  assert.equal(isTestIdentity(testUserId), true);

  const result = await recordAndExecuteMetaDeletion(testUserId);
  assert.ok(result.confirmationCode);
  assert.equal(result.record.details?.isTestRequest, true);
  assert.equal(result.record.details?.scope, "elvaveo_social_media_manager_test");
  assert.ok(result.record.details?.deletedEntities?.includes("test_fixture_session"));
});

// ============================================================================
// POST /api/meta/data-deletion CALLBACK HANDLER TESTS
// ============================================================================

test("Handler POST: Valid urlencoded request returns strictly alphanumeric confirmation code", async () => {
  const testUserId = `api_user_${Date.now()}`;
  const signedRequest = createMetaSignedRequest(
    { algorithm: "HMAC-SHA256", user_id: testUserId },
    TEST_SECRET
  );

  const req = new Request("https://elvaveo.com/api/meta/data-deletion", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `signed_request=${encodeURIComponent(signedRequest)}`,
  });

  const response = await handleMetaDataDeletionPost(req);
  assert.equal(response.status, 200);

  const json = response.body;
  assert.ok(json.url, "Response must include url");
  assert.ok(json.confirmation_code, "Response must include confirmation_code");
  assert.ok(json.url.includes(json.confirmation_code), "URL must contain confirmation_code");
  // Strictly alphanumeric check
  assert.match(json.confirmation_code, /^[A-Z0-9]{32}$/);
});

test("Handler POST: JSON body format is also accepted", async () => {
  const testUserId = `json_user_${Date.now()}`;
  const signedRequest = createMetaSignedRequest(
    { algorithm: "HMAC-SHA256", user_id: testUserId },
    TEST_SECRET
  );

  const req = new Request("https://elvaveo.com/api/meta/data-deletion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ signed_request: signedRequest }),
  });

  const response = await handleMetaDataDeletionPost(req);
  assert.equal(response.status, 200);

  const json = response.body;
  assert.ok(json.url);
  assert.ok(json.confirmation_code);
  assert.match(json.confirmation_code, /^[A-Z0-9]{32}$/);
});

test("Handler POST: Missing signed_request returns 400 Bad Request", async () => {
  const req = new Request("https://elvaveo.com/api/meta/data-deletion", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "other_param=foo",
  });

  const response = await handleMetaDataDeletionPost(req);
  assert.equal(response.status, 400);
  assert.ok(response.body.error);
});

test("Handler POST: Missing server META_APP_SECRET fails securely with 503", async () => {
  const originalSecret = process.env.META_APP_SECRET;
  delete process.env.META_APP_SECRET;

  const signedRequest = createMetaSignedRequest(
    { algorithm: "HMAC-SHA256", user_id: "test_secret_user" },
    TEST_SECRET
  );

  const req = new Request("https://elvaveo.com/api/meta/data-deletion", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `signed_request=${encodeURIComponent(signedRequest)}`,
  });

  const response = await handleMetaDataDeletionPost(req);
  assert.equal(response.status, 503);
  assert.ok(response.body.error.includes("Meta App Secret is not configured"));

  process.env.META_APP_SECRET = originalSecret;
});

test("Handler POST: Invalid signature returns 400 Bad Request", async () => {
  const signedRequest = createMetaSignedRequest(
    { algorithm: "HMAC-SHA256", user_id: "12345" },
    "invalid_secret"
  );

  const req = new Request("https://elvaveo.com/api/meta/data-deletion", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `signed_request=${encodeURIComponent(signedRequest)}`,
  });

  const response = await handleMetaDataDeletionPost(req);
  assert.equal(response.status, 400);
  assert.ok(response.body.error);
});

// ============================================================================
// GET STATUS PAGE & API VERIFICATION TESTS
// ============================================================================

test("Handler GET: Initial visit with no code renders lookup page in HTML", async () => {
  const req = new Request("https://elvaveo.com/api/meta/data-deletion", {
    method: "GET",
    headers: { Accept: "text/html" },
  });

  const res = await handleMetaDataDeletionGet(req);
  assert.equal(res.status, 200);
  assert.ok(res.contentType.includes("text/html"));
  assert.ok(res.body.includes("Meta Data Deletion Status"));
  assert.ok(res.body.includes("Enter the confirmation code received from your Meta data deletion request to check the status."));
  assert.ok(res.body.includes("Verify Status"));
});

test("Handler GET: Initial visit with no code returns 400 in JSON API", async () => {
  const req = new Request("https://elvaveo.com/api/meta/data-deletion", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const res = await handleMetaDataDeletionGet(req);
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.includes("Missing confirmation code"));
});

test("Handler GET: Completed status verification", async () => {
  const testUserId = `completed_user_${Date.now()}`;
  const { confirmationCode } = await recordAndExecuteMetaDeletion(testUserId);

  // 1. JSON API verification
  const jsonReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(confirmationCode)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );
  const jsonRes = await handleMetaDataDeletionGet(jsonReq);
  assert.equal(jsonRes.status, 200);
  assert.equal(jsonRes.contentType, "application/json");
  const data = jsonRes.body;
  assert.equal(data.success, true);
  assert.equal(data.confirmation_code, confirmationCode);
  assert.equal(data.status, "completed");
  assert.ok(data.requested_at);
  assert.ok(data.completed_at);
  assert.equal(data.scope, "ELVAVEO Social Media Manager");
  assert.ok(data.message.includes("permanently deleted"));

  // Privacy assurance: NO userId or personal data exposed in public API response
  assert.equal(data.user_id, undefined);
  assert.equal(data.userId, undefined);

  // 2. HTML verification
  const htmlReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(confirmationCode)}`,
    {
      method: "GET",
      headers: { Accept: "text/html" },
    }
  );
  const htmlRes = await handleMetaDataDeletionGet(htmlReq);
  assert.equal(htmlRes.status, 200);
  assert.ok(htmlRes.body.includes(confirmationCode));
  assert.ok(htmlRes.body.includes("Deletion Completed"));
  assert.ok(htmlRes.body.includes("Completed"));
  assert.ok(!htmlRes.body.includes(testUserId)); // Raw user ID not leaked
});

test("Handler GET: Pending status verification", async () => {
  const pendingCode = generateAlphanumericConfirmationCode(32);
  const now = new Date().toISOString();

  await saveMetaDeletionRecord({
    confirmationCode: pendingCode,
    userIdHash: hashUserId("pending_meta_user_999"),
    userId: null,
    status: "pending",
    requestedAt: now,
    completedAt: null,
    source: "meta_queue",
    details: { scope: "elvaveo_social_media_manager" },
  });

  // 1. JSON API verification
  const jsonReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(pendingCode)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );
  const jsonRes = await handleMetaDataDeletionGet(jsonReq);
  assert.equal(jsonRes.status, 200);
  const data = jsonRes.body;
  assert.equal(data.success, true);
  assert.equal(data.confirmation_code, pendingCode);
  assert.equal(data.status, "pending");
  assert.equal(data.completed_at, null); // Not marked completed
  assert.ok(data.message.includes("pending"));
  assert.equal(data.user_id, undefined);

  // 2. HTML verification
  const htmlReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(pendingCode)}`,
    {
      method: "GET",
      headers: { Accept: "text/html" },
    }
  );
  const htmlRes = await handleMetaDataDeletionGet(htmlReq);
  assert.equal(htmlRes.status, 200);
  assert.ok(htmlRes.body.includes(pendingCode));
  assert.ok(htmlRes.body.includes("Deletion Pending"));
  assert.ok(!htmlRes.body.includes("pending_meta_user_999"));
});

test("Handler GET: Processing status verification", async () => {
  const procCode = generateAlphanumericConfirmationCode(32);
  const now = new Date().toISOString();

  await saveMetaDeletionRecord({
    confirmationCode: procCode,
    userIdHash: hashUserId("proc_meta_user_888"),
    userId: null,
    status: "processing",
    requestedAt: now,
    completedAt: null,
    source: "meta_worker",
    details: { scope: "elvaveo_social_media_manager" },
  });

  // 1. JSON API verification
  const jsonReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(procCode)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );
  const jsonRes = await handleMetaDataDeletionGet(jsonReq);
  assert.equal(jsonRes.status, 200);
  const data = jsonRes.body;
  assert.equal(data.success, true);
  assert.equal(data.confirmation_code, procCode);
  assert.equal(data.status, "processing");
  assert.equal(data.completed_at, null); // Not marked completed
  assert.ok(data.message.includes("processing"));

  // 2. HTML verification
  const htmlReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(procCode)}`,
    {
      method: "GET",
      headers: { Accept: "text/html" },
    }
  );
  const htmlRes = await handleMetaDataDeletionGet(htmlReq);
  assert.equal(htmlRes.status, 200);
  assert.ok(htmlRes.body.includes(procCode));
  assert.ok(htmlRes.body.includes("Deletion Processing"));
  assert.ok(!htmlRes.body.includes("proc_meta_user_888"));
});

test("Handler GET: Failed status verification", async () => {
  const failedCode = generateAlphanumericConfirmationCode(32);
  const now = new Date().toISOString();

  await saveMetaDeletionRecord({
    confirmationCode: failedCode,
    userIdHash: hashUserId("failed_meta_user_777"),
    userId: null,
    status: "failed",
    requestedAt: now,
    completedAt: null,
    source: "meta_worker",
    details: { error: "Network timeout communicating with downstream service" },
  });

  // 1. JSON API verification
  const jsonReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(failedCode)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );
  const jsonRes = await handleMetaDataDeletionGet(jsonReq);
  assert.equal(jsonRes.status, 200);
  const data = jsonRes.body;
  assert.equal(data.success, true);
  assert.equal(data.confirmation_code, failedCode);
  assert.equal(data.status, "failed");
  assert.equal(data.completed_at, null); // Must not be marked completed
  assert.ok(data.message.includes("unexpected system error"));

  // 2. HTML verification
  const htmlReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(failedCode)}`,
    {
      method: "GET",
      headers: { Accept: "text/html" },
    }
  );
  const htmlRes = await handleMetaDataDeletionGet(htmlReq);
  assert.equal(htmlRes.status, 200);
  assert.ok(htmlRes.body.includes(failedCode));
  assert.ok(htmlRes.body.includes("Deletion Failed"));
  assert.ok(!htmlRes.body.includes("failed_meta_user_777"));
});

test("Handler GET: Malformed confirmation code format returns 400 Bad Request", async () => {
  const malformedCodes = [
    "<script>alert(1)</script>",
    "code with space",
    "abc", // too short
    "code' OR 1=1;--",
  ];

  for (const code of malformedCodes) {
    // JSON check
    const jsonReq = new Request(
      `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );
    const jsonRes = await handleMetaDataDeletionGet(jsonReq);
    assert.equal(jsonRes.status, 400);
    assert.equal(jsonRes.body.success, false);
    assert.ok(jsonRes.body.error.includes("Invalid confirmation code format"));

    // HTML check
    const htmlReq = new Request(
      `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: { Accept: "text/html" },
      }
    );
    const htmlRes = await handleMetaDataDeletionGet(htmlReq);
    assert.equal(htmlRes.status, 400);
    assert.ok(htmlRes.body.includes("Invalid confirmation code format"));
  }
});

test("Handler GET: Non-existent well-formed code returns 404 Not Found", async () => {
  const nonExistentCode = "00000000000000000000000000000000";

  // JSON check
  const jsonReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(nonExistentCode)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );
  const jsonRes = await handleMetaDataDeletionGet(jsonReq);
  assert.equal(jsonRes.status, 404);
  assert.equal(jsonRes.body.success, false);
  assert.ok(jsonRes.body.error.includes("not found"));

  // HTML check
  const htmlReq = new Request(
    `https://elvaveo.com/api/meta/data-deletion?code=${encodeURIComponent(nonExistentCode)}`,
    {
      method: "GET",
      headers: { Accept: "text/html" },
    }
  );
  const htmlRes = await handleMetaDataDeletionGet(htmlReq);
  assert.equal(htmlRes.status, 404);
  assert.ok(htmlRes.body.includes("not found"));
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

test("Rate Limiting: Exceeding threshold triggers HTTP 429 Too Many Requests", async () => {
  resetMetaDataDeletionRateLimits();

  const testIp = "198.51.100.42";
  const limitKey = `meta_status_check_${testIp}`;

  // Fill up the rate limit bucket (threshold = 30)
  for (let i = 0; i < 30; i++) {
    const res = checkMetaDataDeletionRateLimit(limitKey, 30, 60);
    assert.equal(res.success, true);
  }

  // 31st request should be rejected by rate limiter
  const blocked = checkMetaDataDeletionRateLimit(limitKey, 30, 60);
  assert.equal(blocked.success, false);
  assert.ok(blocked.resetSeconds > 0);

  // When request passes this IP header into handleMetaDataDeletionGet
  const req = new Request("https://elvaveo.com/api/meta/data-deletion?code=VALIDCODE1234567890ABCDEF123456", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-forwarded-for": testIp,
    },
  });

  const getRes = await handleMetaDataDeletionGet(req);
  assert.equal(getRes.status, 429);
  assert.equal(getRes.body.success, false);
  assert.ok(getRes.body.error.includes("Too many verification requests"));

  // Reset rate limits cleanly
  resetMetaDataDeletionRateLimits();
});
