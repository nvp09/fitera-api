import "dotenv/config";
import express from "express";
import cors from "cors";

import postsRouter from "./routes/posts.routes.mjs";
import authRouter from "./routes/auth.mjs";
import protectUser from "./middlewares/protectUser.mjs";
import protectAdmin from "./middlewares/protectAdmin.mjs";
import postUploadRouter from "./apps/postUpload.routes.mjs";

const app = express(); // MIDDLEWARE
const port = process.env.PORT || 4000; // PORT


// ===== CORS =====
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend local (Vite)
      "http://localhost:5174", // 
      "http://localhost:3000", // เผื่อ React แบบอื่น
      "https://fitera-app.vercel.app", // URL frontend deploy จริง
    ],
    credentials: true,
  })
);

// ===== BODY PARSER =====
app.use(express.json());


// ===================================================
// ====================== ROOT =======================
// ===================================================

app.get("/", (req, res) => {
  res.json({
    project: "Fitera Personal Blog API",
    status: "running",
    baseUrl: "http://localhost:4000/api",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      posts: "/api/posts",
      upload: "/api/posts/upload",
    },
  });
});


// ===================================================
// ====================== ROUTES =====================
// ===================================================

// ===== AUTH ROUTES =====
app.use("/api/auth", authRouter);

// ===== POST UPLOAD ROUTE (ADMIN ONLY INSIDE ROUTER) =====
app.use("/api/posts/upload", postUploadRouter);

// ===== POSTS ROUTES =====
app.use("/api/posts", postsRouter);


// ===================================================
// ====================== HEALTH =====================
// ===================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});


// ===================================================
// ================== PROTECTED TEST =================
// ===================================================

// ===== USER PROTECTED TEST =====
app.get("/api/protected-route", protectUser, (req, res) => {
  res.json({
    message: "This is protected content",
    user: req.user,
  });
});

// ===== ADMIN ONLY TEST =====
app.get("/api/admin-only", protectAdmin, (req, res) => {
  res.status(200).json({
    message: "This is admin-only content",
    admin: req.user,
  });
});


// ===================================================
// ==================== START SERVER =================
// ===================================================

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
