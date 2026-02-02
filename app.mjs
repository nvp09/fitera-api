import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Hello TechUp!");
});

// ===== PROFILE API (ตามโจทย์) =====
app.get("/profile", (req, res) => {
  res.json({
    data: {
      name: "john",
      age: 20
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
