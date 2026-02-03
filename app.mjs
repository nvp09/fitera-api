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
        "https://fitera.vercel.app", // ใส่ URL frontend ที่ deploy จริง
      ],
    })
  );
  


// ===== TEST ROOT =====
app.get("/", (req, res) => {
  res.send("Hello TechUp!");
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

// ===== GET ALL POSTS =====
app.get("/posts", async (req, res) => {
    try {
      const query = `
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
        ORDER BY posts.date DESC;
      `;
  
      const result = await pool.query(query);
  
      res.status(200).json({
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
  
      // basic validation
      if (!image || !title || !content) {
        return res.status(400).json({
          message: "Missing required fields",
        });
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
        message: "Server could not create post because database connection",
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
  
    // check missing data
    if (!image || !category_id || !title || !content || !status_id) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }
  
    try {
      //  update post
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
  
      //  not found
      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }
  
      //  success
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
      // ลบ post
      const result = await pool.query(
        "DELETE FROM posts WHERE id = $1 RETURNING *",
        [id]
      );
  
      // ถ้าไม่เจอ post
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
