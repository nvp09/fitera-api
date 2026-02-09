import "dotenv/config";
import express from "express";
import cors from "cors";
import postsRouter from "./routes/posts.routes.mjs";

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


// ===== USE POSTS ROUTER =====
app.use("/posts", postsRouter);


// ===== HEALTH CHECK =====
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
