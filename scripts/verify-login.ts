
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function verify() {
  const admin = await db.query.users.findFirst({
    where: eq(users.employeeId, "ADMIN-001"),
  });

  if (!admin) {
    console.error("Admin user not found");
    process.exit(1);
  }

  console.log("Admin Hash:", admin.pin);
  
  const pin = "1234";
  const isValid = await bcrypt.compare(pin, admin.pin);
  
  console.log(`Verifying PIN '${pin}' against hash:`, isValid);
  
  // Also try verifying with Bun.password.verify to see if THAT works
  const isValidBun = await Bun.password.verify(pin, admin.pin);
  console.log(`Verifying with Bun.password:`, isValidBun);
}

verify().catch(console.error);
