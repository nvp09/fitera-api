import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

// ===== CREATE SUPABASE CLIENT =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ===== PROTECT USER MIDDLEWARE =====
const protectUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // ===== CHECK TOKEN EXISTS =====
  if (!token) {
    return res.status(401).json({
      error: "Unauthorized: Token missing",
    });
  }

  try {
    // ===== VERIFY TOKEN WITH SUPABASE =====
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Unauthorized: Invalid or expired token",
      });
    }

    // ===== ATTACH USER TO REQUEST =====
    req.user = { ...data.user };

    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export default protectUser;
