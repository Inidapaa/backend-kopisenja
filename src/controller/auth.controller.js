import supabase from "../utils/supabase/client.js";

export default {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async AuthLogin(req, res) {
    // SET CORS HEADER LEBIH AWAL
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim(),
      password,
    });

    if (error) {
      console.error("AuthLogin error:", error.message);
      return res.status(401).json({
        status: false,
        pesan: error.message || "Terjadi kesalahan",
      });
    }

    const { access_token, refresh_token } = data.session;

    res.cookie("jwt", access_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: false,
      secure: false,
      path: "/"
    });

    res.cookie("jwt_refresh", refresh_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: false,
      secure: false,
      path: "/"
    });

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
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(401).json({
        status: false,
        pesan: error.message || "Terjadi Kesalahan",
      });
    }

    res.cookie("jwt", "", { maxAge: 0, httpOnly: false, sameSite: false, secure: false, path: "/" });
    res.cookie("jwt_refresh", "", { maxAge: 0, httpOnly: false, sameSite: false, secure: false, path: "/" });

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
