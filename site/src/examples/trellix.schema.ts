import { relations, sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Context } from "hono";

import type { Env } from "../env.js";
import type { AuthVariables } from "../middleware/authentication.js";
import { user } from "./authentication.schema.js";

export const board = sqliteTable("board", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
	userId: int("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const column = sqliteTable("column", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
	boardId: int("board_id")
		.notNull()
		.references(() => board.id, { onDelete: "cascade" }),
});

export const card = sqliteTable("card", {
	id: int("id").primaryKey({ autoIncrement: true }),
	content: text("content").notNull(),
	index: int("index").notNull(),
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
	columnId: int("column_id")
		.notNull()
		.references(() => column.id, { onDelete: "cascade" }),
	boardId: int("board_id")
		.notNull()
		.references(() => board.id, { onDelete: "cascade" }),
});

export const boardRelations = relations(board, ({ many }) => ({
	columns: many(column),
}));

export const columnRelations = relations(column, ({ many, one }) => ({
	board: one(board, {
		fields: [column.id],
		references: [board.id],
	}),
	cards: many(card),
}));

export const cardRelations = relations(card, ({ one }) => ({
	column: one(column, {
		fields: [card.columnId],
		references: [column.id],
	}),
}));
