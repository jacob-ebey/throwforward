import { Hono } from "hono";

import * as login from "./authentication.login.js";
import * as logout from "./authentication.logout.js";
import * as signup from "./authentication.signup.js";

export const app = new Hono()
	.route("", login.app)
	.route("", logout.app)
	.route("", signup.app);
