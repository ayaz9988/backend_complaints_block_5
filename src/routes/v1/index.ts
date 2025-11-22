import express, { Router } from "express";

import auth from "./auth";

const v1: Router = express.Router();

v1.use("/auth", auth);

export default v1;
