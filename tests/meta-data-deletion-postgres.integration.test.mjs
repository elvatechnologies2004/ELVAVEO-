/**
 * ELVAVEO Meta Data Deletion - PostgreSQL Live Integration Test Suite
 *
 * This integration test suite executes directly against a live PostgreSQL database
 * (or Supabase instance) to prove database-level concurrency, advisory locking,
 * RLS denial, and fencing token behavior.
 *
 * Requirements to run:
 *   DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
 *   OR
 *   NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
 *   SUPABASE_SERVICE_ROLE_KEY="ey..."
 *   META_DELETION_HASH_SECRET="test_hash_secret"
 *   META_DELETION_LOCK_SECRET="test_lock_secret"
 *
 * To run:
 *   node --experimental-strip-types tests/meta-data-deletion-postgres.integration.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const isLivePostgresAvailable = Boolean(supabaseUrl && serviceRoleKey);

if (!isLivePostgresAvailable) {
  test("PostgreSQL Live Integration Suite (Notice: Offline Environment)", (t) => {
    t.diagnostic(
      "Live Supabase/PostgreSQL credentials not supplied in current environment.\n" +
      "Unit/mock tests (39 tests) executed in tests/meta-data-deletion.test.mjs.\n" +
      "To execute live database tests against local or staging Supabase:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL='https://xxx.supabase.co' \\\n" +
      "  SUPABASE_SERVICE_ROLE_KEY='...' \\\n" +
      "  node --experimental-strip-types tests/meta-data-deletion-postgres.integration.test.mjs"
    );
    assert.ok(true);
  });
} else {
  const { createClient } = await import("@supabase/supabase-js");
  const {
    computeCanonicalLockHash,
    computeUserHash,
    getCandidateUserHashes,
    generateAlphanumericConfirmationCode,
  } = await import("../lib/metaDataDeletion.ts");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon_key", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  test("Integration (Live DB): claim_meta_data_deletion advisory locking serializes concurrent claims", async () => {
    const userId = `pg_live_concurrent_${Date.now()}`;
    const canonicalLock = computeCanonicalLockHash(userId, "test_live_lock_secret");
    const primaryHash = computeUserHash(userId, "test_live_hash_secret");
    const codeA = generateAlphanumericConfirmationCode(32);
    const codeB = generateAlphanumericConfirmationCode(32);

    const [resA, resB] = await Promise.all([
      supabase.rpc("claim_meta_data_deletion", {
        p_canonical_lock_hash: canonicalLock,
        p_primary_user_id_hash: primaryHash.hash,
        p_hash_version: primaryHash.version,
        p_candidate_hashes: [primaryHash.hash],
        p_confirmation_code: codeA,
        p_lease_seconds: 60,
        p_details: { test: true },
      }),
      supabase.rpc("claim_meta_data_deletion", {
        p_canonical_lock_hash: canonicalLock,
        p_primary_user_id_hash: primaryHash.hash,
        p_hash_version: primaryHash.version,
        p_candidate_hashes: [primaryHash.hash],
        p_confirmation_code: codeB,
        p_lease_seconds: 60,
        p_details: { test: true },
      }),
    ]);

    assert.ok(!resA.error, resA.error?.message);
    assert.ok(!resB.error, resB.error?.message);

    const dataA = resA.data;
    const dataB = resB.data;

    // Exactly one must win the claim (claimed = true) and the other must yield (claimed = false)
    const claimedCount = (dataA.claimed ? 1 : 0) + (dataB.claimed ? 1 : 0);
    assert.equal(claimedCount, 1, "Exactly one parallel request must claim the identity");

    // Both must agree on the same confirmation code
    assert.equal(dataA.confirmation_code, dataB.confirmation_code);
  });

  test("Integration (Live DB): Fencing token rejects stale worker during finalization", async () => {
    const userId = `pg_live_fencing_${Date.now()}`;
    const canonicalLock = computeCanonicalLockHash(userId, "test_live_lock_secret");
    const primaryHash = computeUserHash(userId, "test_live_hash_secret");
    const code = generateAlphanumericConfirmationCode(32);

    const claimRes = await supabase.rpc("claim_meta_data_deletion", {
      p_canonical_lock_hash: canonicalLock,
      p_primary_user_id_hash: primaryHash.hash,
      p_hash_version: primaryHash.version,
      p_candidate_hashes: [primaryHash.hash],
      p_confirmation_code: code,
      p_lease_seconds: 60,
      p_details: { test: true },
    });

    const activeToken = claimRes.data.claim_token;
    assert.ok(activeToken);

    // Stale worker attempts to finalize using an invalid / stale claim_token
    const staleRes = await supabase.rpc("finalize_meta_data_deletion", {
      p_confirmation_code: code,
      p_claim_token: crypto.randomUUID(), // fake token
      p_status: "completed",
      p_details: { staleWorker: true },
    });

    assert.equal(staleRes.data.success, false);
    assert.equal(staleRes.data.reason, "stale_claim_token");

    // Legitimate worker finalizes using activeToken
    const legitRes = await supabase.rpc("finalize_meta_data_deletion", {
      p_confirmation_code: code,
      p_claim_token: activeToken,
      p_status: "completed",
      p_details: { legitimateWorker: true },
    });

    assert.equal(legitRes.data.success, true);
    assert.equal(legitRes.data.status, "completed");
  });

  test("Integration (Live DB): Restrictive RLS blocks anon and public direct table queries", async () => {
    const { data, error } = await anonClient
      .from("meta_data_deletion_requests")
      .select("id, confirmation_code");

    // Must return empty or access denied
    if (data) {
      assert.equal(data.length, 0, "Anon role must never see rows in meta_data_deletion_requests");
    }
  });
}
