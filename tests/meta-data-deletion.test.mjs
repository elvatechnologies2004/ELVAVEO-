import test from "node:test";
import assert from "node:assert/strict";

const {
  parseAndVerifyMetaSignedRequest,
  createMetaSignedRequest,
  recordAndExecuteMetaDeletion,
  getMetaDeletionRecord,
  saveMetaDeletionRecord,
  updateMetaDeletionStatus,
  isValidConfirmationCode,
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
// IDEMPOTENCY & ISOLATION TESTS
// ============================================================================

test("Meta Data Deletion: Idempotent processing returns the same confirmation code on repeat requests", async () => {
  const uniqueTestUserId = `test_user_id_${Date.now()}_${Math.random()}`;

  // 1. First deletion request
  const firstResult = await recordAndExecuteMetaDeletion(uniqueTestUserId, {
    clientIp: "127.0.0.1",
  });
  assert.ok(firstResult.confirmationCode);
  assert.equal(firstResult.isRepeat, false);
  assert.equal(firstResult.record.userId, uniqueTestUserId);
  assert.equal(firstResult.record.status, "completed");

  // 2. Second deletion request with the same user ID (Repeat / Retried request)
  const secondResult = await recordAndExecuteMetaDeletion(uniqueTestUserId, {
    clientIp: "127.0.0.1",
  });
  assert.equal(secondResult.isRepeat, true);
  assert.equal(secondResult.confirmationCode, firstResult.confirmationCode);
  assert.equal(secondResult.record.confirmationCode, firstResult.confirmationCode);

  // 3. Verify internal lookup returns the record
  const fetchedRecord = await getMetaDeletionRecord(firstResult.confirmationCode);
  assert.ok(fetchedRecord);
  assert.equal(fetchedRecord.confirmationCode, firstResult.confirmationCode);
  assert.equal(fetchedRecord.userId, uniqueTestUserId);
});

test("Meta Data Deletion: Different users receive distinct confirmation codes", async () => {
  const userA = `user_a_${Date.now()}`;
  const userB = `user_b_${Date.now()}`;

  const resA = await recordAndExecuteMetaDeletion(userA);
  const resB = await recordAndExecuteMetaDeletion(userB);

  assert.notEqual(resA.confirmationCode, resB.confirmationCode);
});

// ============================================================================
// POST /api/meta/data-deletion CALLBACK HANDLER TESTS
// ============================================================================

test("Handler POST: Valid urlencoded request returns Meta required JSON format", async () => {
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
  assert.ok(json.confirmation_code.startsWith("meta_del_"));
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
// INPUT VALIDATION TESTS (CONFIRMATION CODES)
// ============================================================================

test("Input Validation: isValidConfirmationCode correctly validates codes", () => {
  assert.equal(isValidConfirmationCode("meta_del_f2cdf77a849f7e8c57e8185f49a47dfc"), true);
  assert.equal(isValidConfirmationCode("meta-del-12345678"), true);
  assert.equal(isValidConfirmationCode("ABCDEF123456"), true);

  // Invalid formats:
  assert.equal(isValidConfirmationCode(""), false);
  assert.equal(isValidConfirmationCode("short"), false); // Under 8 chars
  assert.equal(isValidConfirmationCode("code with spaces"), false);
  assert.equal(isValidConfirmationCode("<script>alert(1)</script>"), false);
  assert.equal(isValidConfirmationCode("code' OR 1=1 --"), false);
  assert.equal(isValidConfirmationCode(null), false);
  assert.equal(isValidConfirmationCode(undefined), false);
  assert.equal(isValidConfirmationCode("a".repeat(100)), false); // Over 80 chars
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
  const pendingCode = `meta_del_pending_${Date.now()}_12345678`;
  const now = new Date().toISOString();

  await saveMetaDeletionRecord({
    confirmationCode: pendingCode,
    userId: "pending_meta_user_999",
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
  const procCode = `meta_del_proc_${Date.now()}_12345678`;
  const now = new Date().toISOString();

  await saveMetaDeletionRecord({
    confirmationCode: procCode,
    userId: "proc_meta_user_888",
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
  const failedCode = `meta_del_failed_${Date.now()}_12345678`;
  const now = new Date().toISOString();

  await saveMetaDeletionRecord({
    confirmationCode: failedCode,
    userId: "failed_meta_user_777",
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
  const nonExistentCode = "meta_del_00000000000000000000000000000000";

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
  const req = new Request("https://elvaveo.com/api/meta/data-deletion?code=meta_del_valid123", {
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
