import assert from "node:assert";

export function getOptionalEnv(envKey: string) {
    return process.env[envKey];
  }
  
  export function getRequiredEnv(envKey: string) {
    const value = process.env[envKey];
    assert(value != null, `Env ${envKey} is not configured.`);
    return value;
  }