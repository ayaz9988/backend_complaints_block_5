import express from "express";
import requireRoles from "../../../middleware/requireRoles";
import { listUploads, deleteUpload } from "./controller";

const uploads = express.Router();

uploads.get("/", requireRoles(["manager", "admin"]), listUploads);

uploads.delete("/:filename", requireRoles(["manager", "admin"]), deleteUpload);

export default uploads;
