import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./utils/db.mjs";


const app = express(); // MIDDLEWARE
const port = process.env.PORT || 4000; // PORT

app.use(express.json()); 

app.use(
    cors({
      origin: [
        "http://localhost:5173", // Frontend local (Vite)
        "http://localhost:3000", // เผื่อ React แบบอื่น
        "https://fitera-app.vercel.app", // ใส่ URL frontend ที่ deploy จริง
      ],
    })
  );
  


// ===== ROOT =====
app.get("/", (req, res) => {
    res.json({
      project: "Fitera Personal Blog API",
      status: "running",
      endpoints: {
        health: "/health",
        posts: "/posts",
      },
    });
  });
  
// ===== DB TEST =====
app.get("/db-test", async (req, res) => {
    try {
      const result = await pool.query("SELECT 1 AS ok");
      res.json({
        message: "Database connected",
        result: result.rows,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Database connection failed",
      });
    }
  });  

// ===== GET ALL POSTS (WITH PAGINATION + FILTER) =====
app.get("/posts", async (req, res) => {
    try {
      const { page = 1, limit = 6, category, keyword } = req.query;
  
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const offset = (pageNumber - 1) * pageSize;
  
      let query = `
        SELECT
          posts.id,
          posts.image,
          posts.title,
          posts.description,
          posts.date,
          posts.likes_count,
          categories.name AS category,
          statuses.status
        FROM posts
        LEFT JOIN categories ON posts.category_id = categories.id
        LEFT JOIN statuses ON posts.status_id = statuses.id
      `;
  
      let countQuery = `
        SELECT COUNT(*) FROM posts
        LEFT JOIN categories ON posts.category_id = categories.id
        LEFT JOIN statuses ON posts.status_id = statuses.id
      `;
  
      let conditions = [];
      let values = [];
      let valueIndex = 1;
  
      // filter by category
      if (category) {
        conditions.push(`categories.name ILIKE $${valueIndex}`);
        values.push(`%${category}%`);
        valueIndex++;
      }
  
      // filter by keyword (title or description)
      if (keyword) {
        conditions.push(`(posts.title ILIKE $${valueIndex} OR posts.description ILIKE $${valueIndex})`);
        values.push(`%${keyword}%`);
        valueIndex++;
      }
  
      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(" AND ");
        countQuery += ` WHERE ` + conditions.join(" AND ");
      }
  
      query += ` ORDER BY posts.date DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
      values.push(pageSize, offset);
  
      const result = await pool.query(query, values);
      const countResult = await pool.query(countQuery, values.slice(0, values.length - 2));
  
      const totalPosts = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalPosts / pageSize);
  
      res.status(200).json({
        totalPosts,
        totalPages,
        currentPage: pageNumber,
        data: result.rows,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  });
  

// ===== GET SINGLE POST =====
app.get("/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const query = `
        SELECT
          posts.id,
          posts.image,
          posts.title,
          posts.description,
          posts.date,
          posts.content,
          posts.likes_count,
          categories.name AS category,
          statuses.status
        FROM posts
        LEFT JOIN categories ON posts.category_id = categories.id
        LEFT JOIN statuses ON posts.status_id = statuses.id
        WHERE posts.id = $1;
      `;
  
      const result = await pool.query(query, [id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }
  
      res.status(200).json({
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  });
  
  
// ===== CREATE POST =====

app.post("/posts", async (req, res) => {
    try {
      const {
        image,
        category_id,
        title,
        description,
        content,
        status_id,
      } = req.body;

      // ===== VALIDATION =====

      if (title === undefined) {
        return res.status(400).json({ message: "Title is required" });
      }
      if (typeof title !== "string") {
        return res.status(400).json({ message: "Title must be a string" });
      }

      if (image === undefined) {
        return res.status(400).json({ message: "Image is required" });
      }
      if (typeof image !== "string") {
        return res.status(400).json({ message: "Image must be a string" });
      }

      if (category_id === undefined) {
        return res.status(400).json({ message: "Category_id is required" });
      }
      if (typeof category_id !== "number") {
        return res.status(400).json({ message: "Category_id must be a number" });
      }

      if (description === undefined) {
        return res.status(400).json({ message: "Description is required" });
      }
      if (typeof description !== "string") {
        return res.status(400).json({ message: "Description must be a string" });
      }

      if (content === undefined) {
        return res.status(400).json({ message: "Content is required" });
      }
      if (typeof content !== "string") {
        return res.status(400).json({ message: "Content must be a string" });
      }

      if (status_id === undefined) {
        return res.status(400).json({ message: "Status_id is required" });
      }
      if (typeof status_id !== "number") {
        return res.status(400).json({ message: "Status_id must be a number" });
      }

      const query = `
        INSERT INTO posts
          (image, category_id, title, description, content, status_id)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
  
      const values = [
        image,
        category_id,
        title,
        description,
        content,
        status_id,
      ];
  
      const result = await pool.query(query, values);
  
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
  });  
  
  
app.put("/posts/:id", async (req, res) => {
    const { id } = req.params;
    const {
      image,
      category_id,
      title,
      description,
      content,
      status_id,
    } = req.body;
  
    // ===== VALIDATION =====

    if (title === undefined) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (typeof title !== "string") {
      return res.status(400).json({ message: "Title must be a string" });
    }

    if (image === undefined) {
      return res.status(400).json({ message: "Image is required" });
    }
    if (typeof image !== "string") {
      return res.status(400).json({ message: "Image must be a string" });
    }

    if (category_id === undefined) {
      return res.status(400).json({ message: "Category_id is required" });
    }
    if (typeof category_id !== "number") {
      return res.status(400).json({ message: "Category_id must be a number" });
    }

    if (description === undefined) {
      return res.status(400).json({ message: "Description is required" });
    }
    if (typeof description !== "string") {
      return res.status(400).json({ message: "Description must be a string" });
    }

    if (content === undefined) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (typeof content !== "string") {
      return res.status(400).json({ message: "Content must be a string" });
    }

    if (status_id === undefined) {
      return res.status(400).json({ message: "Status_id is required" });
    }
    if (typeof status_id !== "number") {
      return res.status(400).json({ message: "Status_id must be a number" });
    }
  
    try {
      const result = await pool.query(
        `
        UPDATE posts
        SET
          image = $1,
          category_id = $2,
          title = $3,
          description = $4,
          content = $5,
          status_id = $6
        WHERE id = $7
        RETURNING *
        `,
        [image, category_id, title, description, content, status_id, id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }
  
      res.status(200).json({
        message: "Post updated successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Server error",
      });
    }
  });
  
  
// ===== DELETE post =====
app.delete("/posts/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        "DELETE FROM posts WHERE id = $1 RETURNING *",
        [id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }
  
      res.status(200).json({
        message: "Post deleted successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  });
  

// ===== HEALTH CHECK =====
app.get("/health", (req, res) => {
    res.status(200).json({
      message: "OK",
    });
  });
  

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
