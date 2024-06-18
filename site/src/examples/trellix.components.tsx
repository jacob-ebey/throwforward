import type { Child, PropsWithChildren } from "hono/jsx";

export function BoardLayout({
	boardId,
	columns,
	tabs,
}: { boardId?: string; columns: Child; tabs: Child }) {
	return (
		<section class="tabs">
			<menu
				id="boards"
				role="tablist"
				class="has-scrollbar"
				aria-label="Tabs Template"
			>
				{tabs}
			</menu>
			{typeof boardId !== "undefined" && (
				<>
					<section
						data-board-section={boardId}
						id="board"
						role="tabpanel"
						class="trellix has-scrollbar"
					>
						<div id="columns">{columns}</div>
						<button
							type="button"
							id="add-column"
							aria-label="Add a column"
							style="height: 23px;"
							onclick="
								const clone = this.querySelector('template').content.cloneNode(true);
								this.before(clone);
								htmx.process(document.body);
								this.style.display = 'none';
								const input = this.previousElementSibling.querySelector('input[type=text]');
								this.previousElementSibling.scrollIntoView({block: 'nearest', inline: 'nearest'});
								input.select();
							"
						>
							+
							<template>
								<div class="window">
									<form
										class="title-bar"
										hx-post={`/trellix/api/board/${boardId}/create-column`}
										hx-swap="transition:false"
										hx-on--before-request="
											const text = this.querySelector('button');
											text.textContent = this.elements.name.value;
											text.style.display = '';
											this.elements.name.style.display = 'none';
											this.classList.remove('error');
											const button = document.getElementById('add-column');
											button.style.display = '';
											button.focus();
										"
										hx-on--after-on-load="
											if (event.detail.xhr.status === 200) {
												this.closest('.window').remove();
											} else {
												this.querySelector('input[type=text]').style.display = '';
												this.querySelector('button').style.display = 'none';
												this.classList.add('error');
											}
										"
									>
										<button
											disabled
											type="button"
											class="title-bar-text"
											style="display: none;"
										/>
										<input
											required
											name="name"
											type="text"
											style="height: 23px;"
											onkeydown="
												if (event.key === 'Escape') {
													this.closest('.window').remove();
													const button = document.getElementById('add-column');
													button.style.display = '';
													button.focus();
												}
											"
										/>
									</form>
									<div class="window-body has-space" />
								</div>
							</template>
						</button>
					</section>
					<dialog id="delete-column-dialog" aria-label="Delete column">
						<div class="window active is-bright">
							<div class="title-bar">
								<div class="title-bar-text" id="dialog-title">
									Delete column
								</div>
								<div class="title-bar-controls">
									<button
										type="button"
										aria-label="Close"
										onclick="
											document.getElementById('delete-column-dialog').close();
											document.body.style.overflow = '';
										"
									/>
								</div>
							</div>
							<div class="window-body has-space">
								<h2 class="instruction instruction-primary">Delete column?</h2>
								<p>
									Do you wish to permanently delete column "<span />
									"?
								</p>
							</div>
							<footer style="text-align: right">
								<button
									type="button"
									class="default"
									name="id"
									hx-sync="closest footer:replace"
									hx-post={`/trellix/api/board/${boardId}/delete-column`}
									hx-on--before-request="
										const dialog = document.getElementById('delete-column-dialog');
										const id = dialog.querySelector('button[name=id]').value;
										const column = document.querySelector(`[data-column='${id}']`);
										dialog.close();
										document.body.style.overflow = '';

										((column.nextElementSibling ?? column.previousElementSibling)?.querySelector('button') ?? document.getElementById('add-column')).focus();

										column.remove();
									"
								>
									Delete
								</button>{" "}
								<button
									type="button"
									onclick="
										document.getElementById('delete-column-dialog').close();
										document.body.style.overflow = '';
									"
								>
									Cancel
								</button>
							</footer>
						</div>
					</dialog>
				</>
			)}
			<dialog id="delete-board-dialog" aria-label="Delete board">
				<div class="window active is-bright">
					<div class="title-bar">
						<div class="title-bar-text" id="dialog-title">
							Delete board
						</div>
						<div class="title-bar-controls">
							<button
								type="button"
								aria-label="Close"
								onclick="
									document.getElementById('delete-board-dialog').close();
									document.body.style.overflow = '';
								"
							/>
						</div>
					</div>
					<div class="window-body has-space">
						<h2 class="instruction instruction-primary">Delete board?</h2>
						<p>
							Do you wish to permanently delete board "<span />
							"?
						</p>
					</div>
					<form
						class="window-footer"
						style="text-align: right"
						hx-post="/trellix/api/delete-board"
						hx-swap="none transition:false"
						hx-sync="closest form:replace"
						hx-on--before-request="
							const dialog = document.getElementById('delete-board-dialog');
							const id = dialog.querySelector('button[name=id]').value;
							const board = document.querySelector(`[data-board='${id}']`);
							dialog.close();
							document.body.style.overflow = '';

							((board.nextElementSibling ?? board.previousElementSibling)?.querySelector('button') ?? document.getElementById('new-board-name')).focus();

							board.remove();
							document.querySelector(`[data-board-section='${id}']`)?.remove();
						"
					>
						<button type="submit" class="default" name="id">
							Delete
						</button>{" "}
						<button
							type="button"
							onclick="
								document.getElementById('delete-board-dialog').close();
								document.body.style.overflow = '';
							"
						>
							Cancel
						</button>
					</form>
				</div>
			</dialog>
		</section>
	);
}

export function BoardTab({
	id,
	name,
	selected,
}: { id: string; name: string; selected?: boolean }) {
	return (
		<a
			id={`board-link-${id}`}
			href={`/trellix/${id}`}
			role="tab"
			class="button"
			hx-swap="transition:false"
			aria-controls="board"
			aria-selected={selected ? "true" : undefined}
			data-board={id}
		>
			<span>{name}</span>
			<button
				type="button"
				style="margin-left: 8px;"
				aria-label={`Delete board "${name}"`}
				onclick={`
					event.preventDefault();
					event.stopPropagation();
					const dialog = document.getElementById('delete-board-dialog');
					dialog.querySelector('span').textContent = this.previousElementSibling.textContent;
					const button = dialog.querySelector('button[name=id]');
					button.value = this.closest('a').dataset.board;
					button.setAttribute('aria-label', 'Permanently delete board "' + this.previousElementSibling.textContent + '"');
					document.body.style.overflow = 'hidden';
					dialog.showModal();
				`}
			>
				x
			</button>
		</a>
	);
}

export function Column({
	children,
	boardId,
	id,
	name,
}: PropsWithChildren<{
	boardId: string;
	id: string;
	name: string;
	key?: string;
}>) {
	return (
		<div class="window active" data-column={id}>
			<div class="title-bar">
				<button
					type="button"
					class="title-bar-text"
					aria-label={`Edit column "${name}" name`}
					onclick="
            this.style.display = 'none';
            this.nextElementSibling.style.display = 'block';
            this.nextElementSibling.select();
          "
				>
					{name}
				</button>
				<input
					required
					type="text"
					name="name"
					value={name}
					style="display: none; height: 23px;"
					hx-post={`/trellix/api/board/${boardId}/column/${id}/update`}
					hx-trigger="keydown[key=='Enter']"
					hx-swap="none transition:false"
					onblur="
            this.style.display = 'none';
            this.previousElementSibling.innerText = this.value;
            this.previousElementSibling.style.display = 'block';
          "
					onkeydown="
            if (event.key === 'Escape' || event.key === 'Enter') {
              this.style.display = 'none';
              this.previousElementSibling.style.display = 'block';
              this.previousElementSibling.focus();
              event.preventDefault();
            }
          "
				/>
				<div class="title-bar-controls" style="top: -4px; position: relative;">
					<button
						type="button"
						aria-label="Close"
						onclick={`
							const dialog = document.getElementById('delete-column-dialog');
							dialog.querySelector('span').textContent = this.parentElement.previousElementSibling.value;
							const button = dialog.querySelector('button[name=id]');
							button.value = this.closest('.window').dataset.column;
							button.setAttribute('aria-label', 'Permanently delete column "' + this.parentElement.previousElementSibling.value + '"');
							document.body.style.overflow = 'hidden';
							dialog.showModal();
						`}
					/>
				</div>
			</div>
			<div class="window-body has-space">
				<form
					tabindex={0}
					hx-post={`/trellix/api/board/${boardId}/sort-column/${id}`}
					hx-trigger="drop"
					hx-boost="false"
					hx-swap="none transition:false"
					hx-sync="closest form:replace"
				>
					<ul id={`column-${id}`} class="sortable" data-sortable-group={id}>
						{children}
					</ul>
				</form>

				<button
					id={`add-card-${id}`}
					type="button"
					aria-label='Add card to "Column 1"'
					onclick="
					  const clone = this.querySelector('template').content.cloneNode(true);
					  this.before(clone);
					  htmx.process(document.body);
					  this.style.display = 'none';
					  this.previousElementSibling.querySelector('input[type=text]').focus();
					"
				>
					+ Add a card
					<template>
						<form
							class="card"
							hx-post={`/trellix/api/board/${boardId}/column/${id}/create-card`}
							hx-swap="transition:false"
							hx-on--before-request={`
                const input = this.querySelector('input[type=text]');
                input.style.display = 'none';
                const span = this.querySelector('span');
                span.style.display = '';
                span.textContent = input.value;
                if (!this.hasBeenSubmitted){
                  const button = document.getElementById('add-card-${id}');
                  button.style.display = '';
                  button.focus();
                }
                this.hasBeenSubmitted = true;
                this.classList.remove('error');
              `}
							hx-on--after-swap="
                if (event.detail.xhr.status === 200) {
                  this.remove();
                } else {
                  this.querySelector('input[type=text]').style.display = '';
                  this.querySelector('span').style.display = 'none';
                  this.classList.add('error');
                }
              "
						>
							<input
								type="text"
								name="content"
								autocomplete="off"
								required
								onkeydown={`
									if (event.key === 'Escape') {
										this.closest('.card').remove();
										const button = document.getElementById('add-card-${id}');
										button.style.display = '';
										button.focus();
									}
								`}
							/>
							<span style="display: none;" />
						</form>
					</template>
				</button>
			</div>
		</div>
	);
}

export function Card({ id, content }: { id: string; content: string }) {
	return (
		<li class="card">
			<input type="hidden" name="id" value={id} />
			<span>{content}</span>
		</li>
	);
}
