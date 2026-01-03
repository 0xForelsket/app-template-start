
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function check() {
  const allUsers = await db.select().from(users);
  console.log("Users found:", allUsers.length);
  allUsers.forEach(u => {
    console.log(`- ${u.name} (${u.employeeId}) Role: ${u.roleId}`);
  });
  process.exit(0);
}

check().catch(console.error);
