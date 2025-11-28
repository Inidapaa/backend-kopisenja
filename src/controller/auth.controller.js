import supabase from "../utils/supabase/client.js";

export default {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async AuthLogin(req, res) {
    const { email, password } = req.body;
    
    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        pesan: "Email dan password harus diisi",
      });
    }

    console.log(`[AUTH LOGIN] Attempting login for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim(),
      password,
    });

    if (error) {
      console.error("[AUTH LOGIN] Error:", error.message, error.status);
      return res.status(401).json({
        status: false,
        pesan: error.message || "Email atau password salah",
      });
    }

    const { access_token, refresh_token } = data.session;

    // Determine if we're in production (HTTPS)
    const isProduction = process.env.NODE_ENV === "production" || req.get("x-forwarded-proto") === "https";

    res.cookie("jwt", access_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/"
    });

    res.cookie("jwt_refresh", refresh_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/"
    });

    console.log(`[AUTH LOGIN] Success for: ${email}`);
    return res.status(200).json({
      status: true,
      pesan: "Berhasil Login",
      data: {
        user: data.user,
        session: {
          access_token: access_token,
          // Jangan kirim refresh_token di response untuk security
        }
      },
    });
  },
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async AuthRegister(req, res) {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        status: false,
        pesan: error.message || "Terjadi kesalahan",
      });
    }

    return res.status(201).json({
      status: true,
      pesan: "Berhasil Login",
      data: data,
    });
  },
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async AuthLogout(req, res) {
    const isProduction = process.env.NODE_ENV === "production" || req.get("x-forwarded-proto") === "https";
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[AUTH LOGOUT] Error:", error.message);
      return res.status(401).json({
        status: false,
        pesan: error.message || "Terjadi Kesalahan",
      });
    }

    res.cookie("jwt", "", { 
      maxAge: 0, 
      httpOnly: false, 
      sameSite: isProduction ? "none" : "lax", 
      secure: isProduction, 
      path: "/" 
    });
    res.cookie("jwt_refresh", "", { 
      maxAge: 0, 
      httpOnly: false, 
      sameSite: isProduction ? "none" : "lax", 
      secure: isProduction, 
      path: "/" 
    });

    return res.status(200).json({
      status: true,
      pesan: "Berhasil Keluar",
    });
  },

  async AuthMe(req, res) {
    try {
      const token = req.cookies?.jwt;
      if (!token) {
        return res.status(401).json({ status: false, pesan: "Unauthorized" });
      }
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return res.status(401).json({ status: false, pesan: error?.message || "Unauthorized" });
      }
      return res.status(200).json({
        status: true,
        pesan: "Berhasil Mengambil Data User",
        user: data.user,
      });
    } catch (error) {
      console.error("Error Mengambil Data User:", error.message);
      return res.status(500).json({
        status: false,
        pesan: "Internal Server Error",
      });
    }
  },
};
