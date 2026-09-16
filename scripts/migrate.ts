import { migrate } from "../server/db.ts";
migrate();
console.log("Migrations applied.");
