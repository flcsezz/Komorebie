var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// test_update_streak.ts
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var envPath = import_path.default.resolve("/home/flcsezz/web-cram/.env");
var envContent = import_fs.default.readFileSync(envPath, "utf8");
var supabaseUrl = "";
var supabaseKey = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("VITE_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("VITE_SUPABASE_ANON_KEY=")) supabaseKey = line.split("=")[1].trim();
}
var headers = {
  "apikey": supabaseKey,
  "Authorization": `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};
var userId = "fbf5b082-20b1-474c-a99b-5b1eb35c0072";
async function testUpdateStreak() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const seconds = 1500;
  console.log("Fetching existing streak...");
  const res1 = await fetch(`${supabaseUrl}/rest/v1/streaks?user_id=eq.${userId}&focus_date=eq.${today}&select=*`, { headers });
  const data1 = await res1.json();
  console.log("Existing:", data1);
  if (data1.length > 0) {
    const existing = data1[0];
    console.log("Updating...");
    const res2 = await fetch(`${supabaseUrl}/rest/v1/streaks?id=eq.${existing.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        total_focus_seconds: (existing.total_focus_seconds || 0) + seconds,
        sessions_count: (existing.sessions_count || 0) + 1,
        streak_qualified: true
      })
    });
    console.log("Update res:", await res2.json());
  } else {
    console.log("Inserting...");
    const res2 = await fetch(`${supabaseUrl}/rest/v1/streaks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        focus_date: today,
        total_focus_seconds: seconds,
        sessions_count: 1,
        streak_qualified: true
      })
    });
    console.log("Insert res:", await res2.json());
  }
}
testUpdateStreak().catch(console.error);
