// ===== IMPORTS =====
import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import protectAdmin from "../middlewares/protectAdmin.mjs";
import multer from "multer";
import supabase from "../utils/supabaseClient.mjs";

const postUploadRouter = Router();

// ===== MULTER CONFIGURATION =====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("imageFile");

// ===== CREATE POST WITH IMAGE UPLOAD (ADMIN ONLY) =====
postUploadRouter.post(
  "/",
  protectAdmin,
  upload,
  
  async (req, res) => {
    try {
      const {
        title,
        category_id,
        description,
        content,
        status_id,
      } = req.body;

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          message: "Image file is required",
        });
      }

      if (!title || !category_id || !description || !content || !status_id) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      const categoryIdNumber = Number(category_id);
      const statusIdNumber = Number(status_id);

      if (isNaN(categoryIdNumber) || isNaN(statusIdNumber)) {
        return res.status(400).json({
          message: "category_id and status_id must be numbers",
        });
      }

      const imageUrl = `uploads/${Date.now()}-${file.originalname}`;

      const result = await connectionPool.query(
        `
        INSERT INTO posts
        (title, image, category_id, description, content, status_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          title,
          imageUrl,
          categoryIdNumber,
          description,
          content,
          statusIdNumber,
        ]
      );

      res.status(201).json({
        message: "Post created successfully",
        data: result.rows[0],
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


export default postUploadRouter;
