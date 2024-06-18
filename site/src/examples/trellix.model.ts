import { and, asc, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";

import * as schema from "./trellix.schema.js";

export async function getBoards(c: Context, userId: number) {
	const db = drizzle(c.env.DB, {
		schema,
	});

	const boards = await db.query.board.findMany({
		where: eq(schema.board.userId, userId),
		orderBy: asc(schema.board.createdAt),
		columns: {
			id: true,
			name: true,
		},
	});

	return boards;
}

export async function getBoard(c: Context, boardId: number, userId: number) {
	const db = drizzle(c.env.DB, {
		schema,
	});

	const boardPromise = boardId
		? db.query.board.findFirst({
				where: and(
					eq(schema.board.id, boardId),
					eq(schema.board.userId, userId),
				),
				columns: {
					id: true,
					name: true,
				},
			})
		: null;
	const columnsPromise = db.query.column.findMany({
		where: eq(schema.column.boardId, boardId),
		orderBy: asc(schema.column.createdAt),
		columns: {
			id: true,
			name: true,
		},
		with: {
			cards: {
				orderBy: asc(schema.card.index),
				columns: {
					id: true,
					content: true,
				},
			},
		},
	});

	const [board, columns] = await Promise.all([boardPromise, columnsPromise]);

	return board
		? {
				...board,
				columns,
			}
		: null;
}

export async function createBoard(c: Context, userId: number, name: string) {
	const db = drizzle(c.env.DB);
	const [createdBoard] = await db
		.insert(schema.board)
		.values({
			userId: Number(userId),
			name,
		})
		.returning({ id: schema.board.id });

	return createdBoard as typeof createdBoard | undefined;
}

export async function deleteBoard(c: Context, userId: number, boardId: number) {
	const db = drizzle(c.env.DB, { schema });
	const [deleted] = await db
		.delete(schema.board)
		.where(and(eq(schema.board.id, boardId), eq(schema.board.userId, userId)))
		.returning();

	return deleted as typeof deleted | undefined;
}

export async function createColumn(
	c: Context,
	userId: number,
	boardId: number,
	name: string,
) {
	const db = drizzle(c.env.DB, { schema });
	const board = await db.query.board.findFirst({
		columns: { id: true },
		where: and(
			eq(schema.board.id, Number(boardId)),
			eq(schema.board.userId, Number(userId)),
		),
	});

	if (!board) {
		return null;
	}

	const [createdColumn] = await db
		.insert(schema.column)
		.values({
			boardId: board.id,
			name,
		})
		.returning();

	return createdColumn as typeof createdColumn | undefined;
}

export async function deleteColumn(
	c: Context,
	userId: number,
	boardId: number,
	columnId: number,
) {
	const db = drizzle(c.env.DB, { schema });
	const [board, column] = await Promise.all([
		db.query.board.findFirst({
			where: and(
				eq(schema.board.id, Number(boardId)),
				eq(schema.board.userId, Number(userId)),
			),
		}),
		db.query.column.findFirst({
			where: and(
				eq(schema.column.id, Number(columnId)),
				eq(schema.column.boardId, Number(boardId)),
			),
		}),
	]);

	if (!board || !column) {
		return;
	}

	const [deleted] = await db
		.delete(schema.column)
		.where(and(eq(schema.column.id, Number(columnId))))
		.returning();

	return deleted as typeof deleted | undefined;
}

export async function updateColumn(
	c: Context,
	userId: number,
	boardId: number,
	columnId: number,
	name: string,
) {
	const db = drizzle(c.env.DB, { schema });

	const [board, column] = await Promise.all([
		db.query.board.findFirst({
			where: and(
				eq(schema.board.id, Number(boardId)),
				eq(schema.board.userId, Number(userId)),
			),
		}),
		db.query.column.findFirst({
			where: and(
				eq(schema.column.id, Number(columnId)),
				eq(schema.column.boardId, Number(boardId)),
			),
		}),
	]);

	if (!board || !column) {
		return;
	}

	const [updated] = await db
		.update(schema.column)
		.set({ name })
		.where(eq(schema.column.id, Number(columnId)))
		.returning();

	return updated as typeof updated | undefined;
}

export async function createCard(
	c: Context,
	userId: number,
	boardId: number,
	columnId: number,
	content: string,
) {
	const db = drizzle(c.env.DB, { schema });

	const [board, column] = await Promise.all([
		db.query.board.findFirst({
			where: and(eq(schema.board.id, boardId), eq(schema.board.userId, userId)),
		}),
		db.query.column.findFirst({
			where: and(
				eq(schema.column.id, columnId),
				eq(schema.column.boardId, boardId),
			),
		}),
	]);

	if (!board || !column) {
		return null;
	}

	const [createdCard] = await db
		.insert(schema.card)
		.values({
			index: (
				await db
					.select({ count: count() })
					.from(schema.card)
					.where(eq(schema.card.columnId, Number(columnId)))
			)[0].count,
			boardId,
			columnId,
			content,
		})
		.returning();

	return createdCard as typeof createdCard | undefined;
}

export async function sortCards(
	c: Context,
	userId: number,
	boardId: number,
	columnId: number,
	cardIds: number[],
) {
	const db = drizzle(c.env.DB, { schema });

	const [board, column] = await Promise.all([
		db.query.board.findFirst({
			where: and(
				eq(schema.board.id, Number(boardId)),
				eq(schema.board.userId, Number(userId)),
			),
		}),
		db.query.column.findFirst({
			where: and(
				eq(schema.column.id, columnId),
				eq(schema.column.boardId, Number(boardId)),
			),
		}),
	]);

	if (!board || !column) {
		return false;
	}

	await Promise.all(
		cardIds.map(async (cardId, index) =>
			db
				.update(schema.card)
				.set({
					columnId,
					index,
				})
				.where(
					and(eq(schema.card.id, cardId), eq(schema.card.boardId, boardId)),
				),
		),
	);
	return true;
}
