import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

async function readLocalEnvironment() {
  const env = { ...process.env };
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    for (const line of (await fs.readFile(envPath, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
      if (!match || env[match[1]]) continue;
      env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return env;
}

function getArgument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function loadLegacyDocument(supabase, sourcePath) {
  if (sourcePath) {
    const file = path.resolve(sourcePath);
    const raw = await fs.readFile(file, "utf8");
    return { file, payload: JSON.parse(raw), raw };
  }

  for (const file of [
    path.join(process.cwd(), "data", "privacy-policy.json"),
    path.join(os.tmpdir(), "elvaveo_store", "privacy-policy.json"),
  ]) {
    try {
      const raw = await fs.readFile(file, "utf8");
      return { file, payload: JSON.parse(raw), raw };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  const { data, error } = await supabase.storage
    .from("uploads")
    .download("store/privacy-policy.json");

  if (error) {
    if (String(error.statusCode) === "404") return null;
    throw new Error(`Could not read the legacy Storage document (status ${error.statusCode || "unknown"}).`);
  }

  const raw = await data.text();
  return { file: "Supabase Storage uploads/store/privacy-policy.json", payload: JSON.parse(raw), raw };
}

async function main() {
  const env = await readLocalEnvironment();
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const legacy = await loadLegacyDocument(supabase, getArgument("source"));

  if (!legacy) {
    console.log("No persisted legacy privacy policy document was found; no backup or import was performed.");
    return;
  }

  if (!legacy.payload || !Array.isArray(legacy.payload.versions) || legacy.payload.versions.length === 0) {
    throw new Error("The legacy document is missing a non-empty versions array; refusing to import.");
  }

  const apply = process.argv.includes("--apply");
  if (!apply) {
    console.log(`Validated legacy document with ${legacy.payload.versions.length} version(s). No data was changed.`);
    return;
  }

  const backupPath = getArgument("backup");
  const actor = getArgument("actor") || env.ADMIN_EMAIL?.trim();
  if (!backupPath || !actor || !actor.includes("@")) {
    throw new Error("Applying requires --backup=<new file path> and --actor=<administrator email>.");
  }

  const resolvedBackupPath = path.resolve(backupPath);
  if (legacy.file !== "Supabase Storage uploads/store/privacy-policy.json"
      && path.resolve(legacy.file) === resolvedBackupPath) {
    throw new Error("Backup path must not overwrite the legacy source.");
  }

  const raw = legacy.raw;
  await fs.mkdir(path.dirname(resolvedBackupPath), { recursive: true });
  await fs.writeFile(resolvedBackupPath, raw, { flag: "wx" });

  const { error } = await supabase.rpc("import_legacy_privacy_policy", {
    p_payload: legacy.payload,
    p_actor: actor,
    p_ip_address: "migration",
  });

  if (error) {
    throw new Error(
      `The backup was created, but the database import failed. Keep the backup and resolve the migration error: ${error.message}`
    );
  }

  console.log(`Imported ${legacy.payload.versions.length} version(s). Backup saved to ${resolvedBackupPath}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Privacy policy migration failed.");
  process.exitCode = 1;
});
