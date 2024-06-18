import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import {
	authenticationMiddleware,
	requireAuthentication,
} from "../middleware/authentication.js";

import { BoardTab, Card, Column } from "./trellix.components.js";
import * as model from "./trellix.model.js";

export const app = new Hono().use(authenticationMiddleware);

app.post(
	"/trellix/api/create-board",
	requireAuthentication({
		redirect: "/authentication?redirect=/trellix",
	}),
	zValidator(
		"form",
		z.object({
			name: z.string().min(1),
		}),
	),
	async (c) => {
		const { name } = c.req.valid("form");

		const createdBoard = await model.createBoard(
			c,
			Number(c.get("userId")),
			name,
		);

		if (!createdBoard) {
			c.status(500);
			return c.text("Failed to create board");
		}

		return c.html(
			<div id="boards" hx-swap-oob="beforeend">
				<BoardTab id={String(createdBoard.id)} name={name} />
			</div>,
		);
	},
);

app.post(
	"/trellix/api/delete-board",
	zValidator(
		"form",
		z.object({
			id: z.coerce.number(),
		}),
	),
	requireAuthentication({
		redirect: (c) => {
			// @ts-expect-error - I suck at types
			const { id } = c.req.valid("form");

			const url = new URL(c.req.url);
			return `/authentication?redirect=/trellix/${id}`;
		},
	}),
	async (c) => {
		const deletedBoard = await model.deleteBoard(
			c,
			Number(c.get("userId")),
			c.req.valid("form").id,
		);

		if (!deletedBoard) {
			c.status(500);
			return c.text("Failed to delete board");
		}

		return c.text("OK");
	},
);

const requireBoardAuth = requireAuthentication({
	redirect: (c) => {
		// @ts-expect-error - I suck at types
		const { boardId } = c.req.valid("param");
		return `/authentication?redirect=/trellix/${boardId}`;
	},
});

app.post(
	"/trellix/api/board/:boardId/create-column",
	zValidator("param", z.object({ boardId: z.coerce.number() })),
	zValidator(
		"form",
		z.object({
			name: z.string().min(1),
		}),
	),
	requireBoardAuth,
	async (c) => {
		const { boardId } = c.req.valid("param");

		const createdColumn = await model.createColumn(
			c,
			Number(c.get("userId")),
			boardId,
			c.req.valid("form").name,
		);

		if (!createdColumn) {
			c.status(500);
			return c.text("Failed to create column");
		}

		return c.html(
			<div id="columns" hx-swap-oob="beforeend">
				<Column
					boardId={String(boardId)}
					id={String(createdColumn.id)}
					name={createdColumn.name}
				/>
			</div>,
		);
	},
);

app.post(
	"/trellix/api/board/:boardId/delete-column",
	zValidator(
		"param",
		z.object({
			boardId: z.coerce.number(),
		}),
	),
	zValidator(
		"form",
		z.object({
			id: z.coerce.number(),
		}),
	),
	requireBoardAuth,
	async (c) => {
		const { boardId } = c.req.valid("param");

		await model.deleteColumn(
			c,
			Number(c.get("userId")),
			boardId,
			c.req.valid("form").id,
		);

		return c.text("OK");
	},
);

app.post(
	"/trellix/api/board/:boardId/column/:columnId/update",
	zValidator(
		"param",
		z.object({
			boardId: z.coerce.number(),
			columnId: z.coerce.number(),
		}),
	),
	zValidator(
		"form",
		z.object({
			name: z.string().min(1),
		}),
	),
	requireBoardAuth,
	async (c) => {
		const { boardId, columnId } = c.req.valid("param");

		await model.updateColumn(
			c,
			Number(c.get("userId")),
			boardId,
			columnId,
			c.req.valid("form").name,
		);

		return c.text("OK");
	},
);

app.post(
	"/trellix/api/board/:boardId/column/:columnId/create-card",
	zValidator(
		"param",
		z.object({
			boardId: z.coerce.number(),
			columnId: z.coerce.number(),
		}),
	),
	zValidator(
		"form",
		z.object({
			content: z.string().min(1),
		}),
	),
	requireBoardAuth,
	async (c) => {
		const { boardId, columnId } = c.req.valid("param");

		const createdCard = await model.createCard(
			c,
			Number(c.get("userId")),
			boardId,
			columnId,
			c.req.valid("form").content,
		);

		if (!createdCard) {
			c.status(500);
			return c.text("Failed to create card");
		}

		return c.html(
			<div id={`column-${columnId}`} hx-swap-oob="beforeend">
				<Card id={String(createdCard.id)} content={createdCard.content} />
			</div>,
		);
	},
);

app.post(
	"/trellix/api/board/:boardId/sort-column/:columnId",
	zValidator(
		"param",
		z.object({
			boardId: z.coerce.number(),
			columnId: z.coerce.number(),
		}),
	),
	requireBoardAuth,
	async (c) => {
		const { boardId, columnId } = c.req.valid("param");

		const success = await model.sortCards(
			c,
			Number(c.get("userId")),
			boardId,
			columnId,
			(await c.req.formData()).getAll("id").map(Number),
		);

		return c.text("OK");
	},
);
