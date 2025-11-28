import express, { Router } from "express";

import auth from "./auth";
import complaints from "./complaints";
import announcements from "./announcements";
import achievements from "./achievements";

const v1: Router = express.Router();

v1.use("/auth", auth);
v1.use("/complaints", complaints);
v1.use("/announcements", announcements);
v1.use("/achievements", achievements);

export default v1;
