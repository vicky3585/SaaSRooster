
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { files, folders, fileShares } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Upload file
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.currentOrgId;
    const { folderId, description, isPublic } = req.body;

    if (!userId || !orgId || !req.file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const fileType = getFileType(req.file.mimetype);
    const fileUrl = `/uploads/${req.file.filename}`;

    const [newFile] = await db
      .insert(files)
      .values({
        orgId,
        folderId: folderId || null,
        name: req.file.filename,
        originalName: req.file.originalname,
        fileType,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        description,
        uploadedBy: userId,
        isPublic: isPublic === "true",
      })
      .returning();

    res.json({ success: true, file: newFile });
  } catch (error: any) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Get all files
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.currentOrgId;
    const { folderId } = req.query;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let query = db.query.files.findMany({
      where: folderId 
        ? and(eq(files.orgId, orgId), eq(files.folderId, folderId as string))
        : eq(files.orgId, orgId),
      orderBy: [desc(files.createdAt)],
      with: {
        uploadedBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const allFiles = await query;
    res.json(allFiles);
  } catch (error: any) {
    console.error("Files fetch error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Create folder
router.post("/folders", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.currentOrgId;
    const { name, parentFolderId } = req.body;

    if (!userId || !orgId || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Build path
    let path = `/${name}`;
    if (parentFolderId) {
      const parentFolder = await db.query.folders.findFirst({
        where: eq(folders.id, parentFolderId),
      });
      if (parentFolder) {
        path = `${parentFolder.path}/${name}`;
      }
    }

    const [newFolder] = await db
      .insert(folders)
      .values({
        orgId,
        name,
        parentFolderId: parentFolderId || null,
        path,
        createdBy: userId,
      })
      .returning();

    res.json({ success: true, folder: newFolder });
  } catch (error: any) {
    console.error("Folder creation error:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// Get folders
router.get("/folders", async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.currentOrgId;
    const { parentFolderId } = req.query;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allFolders = await db.query.folders.findMany({
      where: parentFolderId
        ? and(eq(folders.orgId, orgId), eq(folders.parentFolderId, parentFolderId as string))
        : eq(folders.orgId, orgId),
      orderBy: [desc(folders.createdAt)],
    });

    res.json(allFolders);
  } catch (error: any) {
    console.error("Folders fetch error:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

// Delete file
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.currentOrgId;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = await db.query.files.findFirst({
      where: and(eq(files.id, id), eq(files.orgId, orgId)),
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), file.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await db.delete(files).where(eq(files.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error("File deletion error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return "spreadsheet";
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("text")
  )
    return "document";
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar"))
    return "archive";
  return "other";
}

export default router;
