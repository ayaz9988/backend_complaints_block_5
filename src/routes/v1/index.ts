import express, { Router } from "express";

import auth from "./auth";
import complaints from "./complaints";

const v1: Router = express.Router();

v1.use("/auth", auth);
v1.use("/complaints", complaints);

export default v1;
