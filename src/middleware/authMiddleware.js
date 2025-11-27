import supabase from "../utils/supabase/client.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const bearer = req.get("Authorization");
    const headerJwt = req.get("jwt");
    const cookieJwt = req.cookies?.jwt;
    
    
    const token = cookieJwt || (bearer?.startsWith("Bearer ") ? bearer.slice(7) : undefined) || headerJwt;

    if (!token) {
      console.log("[AUTH DEBUG] Token final: TIDAK ADA");
      return res.status(401).json({
        status: false,
        pesan: "Unauthorized - Tidak ada token yang disediakan",
      });
    }
    
    console.log("[AUTH DEBUG] Token final: ADA, panjang:", token.length);

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        status: false,
        pesan: error?.message || "Unauthorized - Token Invalid",
      });
    }

    req.user = data.user;

    next();
  } catch (err) {
    console.error("AuthMiddleware Error:", err);
    return res.status(500).json({
      status: false,
      pesan: "Internal Server Error",
    });
  }
};
