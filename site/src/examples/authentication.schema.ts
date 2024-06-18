import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name"),
	email: text("email").notNull(),
	password: text("password").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});
