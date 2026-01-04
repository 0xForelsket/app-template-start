console.log("Checking Environment...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Missing");
console.log("SESSION_SECRET:", process.env.SESSION_SECRET ? "Set" : "Missing");
console.log("SESSION_SECRET Length:", process.env.SESSION_SECRET?.length);

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error("FAIL: SESSION_SECRET is missing or too short.");
} else {
  console.log("PASS: Environment looks good.");
}
