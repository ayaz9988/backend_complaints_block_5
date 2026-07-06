import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import config from "../../../config";

const uploadDir = path.resolve(process.cwd(), config.uploadDir);

export async function listUploads(_req: Request, res: Response) {
  try {
    const files = fs.readdirSync(uploadDir).filter((f) => {
      const filePath = path.join(uploadDir, f);
      return fs.statSync(filePath).isFile();
    });
    const uploads = files.map((filename) => ({
      filename,
      url: `/uploads/${filename}`,
      size: fs.statSync(path.join(uploadDir, filename)).size,
    }));
    res.json(uploads);
  } catch {
    res.status(500).json({ error: "Failed to list uploads" });
  }
}

export async function deleteUpload(req: Request, res: Response) {
  const filename = req.params.filename as string;

  const sanitized = path.basename(filename);
  const filePath = path.join(uploadDir, sanitized);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted", filename: sanitized });
  } catch {
    res.status(500).json({ error: "Failed to delete file" });
  }
}
