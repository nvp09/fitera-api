import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import connectionPool from "../utils/db.mjs";

const authRouter = Router();

// ===== CREATE SUPABASE CLIENT =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);


// ===== REGISTER USER =====
authRouter.post("/register", async (req, res) => {
  const { email, password, username, name } = req.body;

  try {
    // ===== CHECK DUPLICATE USERNAME =====
    const usernameCheckQuery = `
      SELECT * FROM users
      WHERE username = $1
    `;
    const { rows: existingUser } = await connectionPool.query(
      usernameCheckQuery,
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: "This username is already taken",
      });
    }

    // ===== CREATE USER IN SUPABASE AUTH =====
    const { data, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (supabaseError) {
      return res.status(400).json({
        error: supabaseError.message,
      });
    }

    const supabaseUserId = data.user.id;

    // ===== INSERT USER INTO DATABASE =====
    const insertQuery = `
      INSERT INTO users (id, username, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const { rows } = await connectionPool.query(insertQuery, [
      supabaseUserId,
      username,
      name,
      "user",
    ]);

    res.status(201).json({
      message: "User created successfully",
      user: rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred during registration",
    });
  }
});


// ===== LOGIN USER (ADMIN + USER รองรับทั้งคู่) =====
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // ===== LOGIN WITH SUPABASE =====
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({
        error: "Invalid email or password",
      });
    }

    const access_token = data.session.access_token;
    const supabaseUserId = data.user.id;

    // ===== GET USER ROLE FROM DATABASE =====
    const query = `
      SELECT id, username, name, role
      FROM users
      WHERE id = $1
    `;

    const { rows } = await connectionPool.query(query, [
      supabaseUserId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "User not found in database",
      });
    }

    const user = rows[0];

    return res.status(200).json({
      message: "Signed in successfully",
      access_token,
      user,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An error occurred during login",
    });
  }
});


// ===== GET CURRENT USER =====
authRouter.get("/get-user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized: Token missing",
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Unauthorized or token expired",
      });
    }

    const supabaseUserId = data.user.id;

    const { rows } = await connectionPool.query(
      `SELECT id, username, name, role FROM users WHERE id = $1`,
      [supabaseUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});


// ===== RESET PASSWORD =====
authRouter.put("/reset-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { oldPassword, newPassword } = req.body;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized: Token missing",
    });
  }

  if (!newPassword) {
    return res.status(400).json({
      error: "New password is required",
    });
  }

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return res.status(401).json({
        error: "Unauthorized or token expired",
      });
    }

    // Verify old password
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: oldPassword,
      });

    if (loginError) {
      return res.status(400).json({
        error: "Invalid old password",
      });
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(200).json({
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default authRouter;
