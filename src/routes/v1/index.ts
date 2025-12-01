import express, { Router } from "express";

import auth from "./auth";
import complaints from "./complaints";
import announcements from "./announcements";
import achievements from "./achievements";
import users from "./users";

const v1: Router = express.Router();

v1.use("/auth", auth);
v1.use("/complaints", complaints);
v1.use("/announcements", announcements);
v1.use("/achievements", achievements);
v1.use("/users", users);

export default v1;
