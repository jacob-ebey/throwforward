import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { CodePreview } from "../components/code-preview.js";
import type { Env } from "../env.js";
import type { AuthVariables } from "../middleware/authentication.js";
import { authenticationMiddleware } from "../middleware/authentication.js";

import actionsSource from "./trellix.actions.js?raw";
import componentsSource from "./trellix.components.js?raw";
import source from "./trellix.js?raw";
import modelSource from "./trellix.model.js?raw";
import schemaSource from "./trellix.schema.js?raw";

import * as actions from "./trellix.actions.js";
import { BoardLayout, BoardTab, Card, Column } from "./trellix.components.js";
import * as model from "./trellix.model.js";

export const app = new Hono<{
	Bindings: Env;
	Variables: AuthVariables;
}>().use(authenticationMiddleware);

app.route("", actions.app);

app.on(
	["GET"],
	["/trellix", "/trellix/:boardId"],
	zValidator("param", z.object({ boardId: z.coerce.number().optional() })),
	async (c, next) => {
		const userId = c.get("userId");
		if (!userId) {
			const url = new URL(c.req.url);
			return c.redirect(`/authentication?redirect=${url.pathname}`);
		}

		const boardsPromise = model.getBoards(c, Number(userId));

		let boardId = c.req.valid("param").boardId;
		if (!boardId) {
			boardId = (await boardsPromise)[0]?.id;
		}

		const [boards, selectedBoard] = await Promise.all([
			boardsPromise,
			typeof boardId === "number"
				? await model.getBoard(c, boardId, Number(userId))
				: null,
		]);

		return c.render(
			<>
				<article>
					<h1>Trellix</h1>
					<hr />
					<p>
						Sometimes you need something super interactive. This is a simple
						example of a trello-like board with optimistic interactions for
						column and card creation, as well as drag-and-drop.
					</p>
					<blockquote>
						<strong>Note:</strong> This example only works with JavaScript
						enabled.
					</blockquote>

					<br />

					<form
						id="new-board-form"
						class="field-row-stacked"
						style="width: 200px"
						hx-post="/trellix/api/create-board"
						hx-swap="none transition:false"
						hx-sync="closest form:queue all"
						hx-indicator="closest form"
						hx-on--before-request="this.reset();"
					>
						<label for="new-board-name">New Board </label>
						<div style="display: flex; align-items: center;">
							<input
								id="new-board-name"
								name="name"
								type="text"
								autocomplete="off"
								required
								minlength={1}
							/>
							<span
								role="alert"
								aria-live="assertive"
								aria-label="Logging in"
								class="htmx-indicator loader animate"
								style="margin: 0 0 0 8px;"
							/>
						</div>
					</form>

					<hr />

					<BoardLayout
						boardId={selectedBoard ? String(selectedBoard.id) : undefined}
						tabs={boards.map((board) => (
							<BoardTab
								id={String(board.id)}
								name={board.name}
								selected={board.id === selectedBoard?.id}
							/>
						))}
						columns={selectedBoard?.columns.map((column) => (
							<Column
								boardId={String(selectedBoard.id)}
								id={String(column.id)}
								name={column.name}
							>
								{column.cards.map((card) => (
									<Card id={String(card.id)} content={card.content} />
								))}
							</Column>
						))}
					/>

					<br />

					<CodePreview source={source} />
					<br />
					<CodePreview label="Show Components Code" source={componentsSource} />
					<br />
					<CodePreview label="Show Actions Code" source={actionsSource} />
					<br />
					<CodePreview label="Show Schema Code" source={schemaSource} />
					<br />
					<CodePreview label="Show Model Code" source={modelSource} />
				</article>
			</>,
		);
	},
);
