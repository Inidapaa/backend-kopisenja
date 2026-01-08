import supabase from "../utils/supabase/client.js";

export default {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getAll(req, res) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getAll:", error.message);
      return res.status(500).json({
        status: false,
        pesan: "Gagal mengambil data produk",
        error: error.message,
      });
    }

    return res.status(200).json({
      status: true,
      pesan: "Berhasil mengambil semua produk",
      data,
    });
  },

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getById(req, res) {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        status: false,
        pesan: "Produk tidak ditemukan",
        error: error.message,
      });
    }

    return res.status(200).json({
      status: true,
      pesan: "Berhasil mengambil produk",
      data,
    });
  },

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async create(req, res) {
    try {
      const { name, description, price, category } = req.body;
      const file = req.file; // dari multer

      let imageUrl = null;

      // ✅ Kalau ada file, upload ke Supabase
      if (file) {
        const fileExt = file.mimetype.split("/")[1];
        const fileName = `prod_${Date.now()}.${fileExt}`;
        const filePath = `produk/images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("kopi-senja-bucket")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("[UPLOAD ERROR]", uploadError);
          return res.status(400).json({
            status: false,
            pesan: "Gagal upload gambar",
            error: uploadError.message,
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from("kopi-senja-bucket")
          .getPublicUrl(uploadData.path);

        imageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        name,
        description: description ?? null,
        price: Number(price) || 0,
        image: imageUrl,
        category: category ?? null,
      };

      const { data, error } = await supabase
        .from("products")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("[DB ERROR]", error);
        return res.status(400).json({
          status: false,
          pesan: "Gagal menambahkan produk",
          error: error.message,
        });
      }

      return res.status(201).json({
        status: true,
        pesan: "Produk berhasil ditambahkan",
        data,
      });
    } catch (error) {
      console.error("[CREATE PRODUCT ERROR]", error);
      return res.status(500).json({
        status: false,
        pesan: error.message,
      });
    }
  },

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, image, imageBase64, category } =
        req.body;
      console.log("[UPDATE PRODUCT] Received:", {
        id,
        name,
        hasImageBase64: !!imageBase64,
        category,
      });

      let imageUrl = image;

      // Upload new image if imageBase64 is provided
      if (imageBase64) {
        console.log("[UPDATE PRODUCT] Processing image upload...");

        // Get current product to optionally delete old image
        const { data: currentProduct } = await supabase
          .from("products")
          .select("image")
          .eq("id", id)
          .single();

        // Upload new image
        const fileExt = "jpg";
        const fileName = `prod_${Date.now()}.${fileExt}`;
        const filePath = `produk/images/${fileName}`;

        const base64Data = imageBase64.split(",")[1] || imageBase64;
        const buffer = Buffer.from(base64Data, "base64");

        console.log("[UPDATE PRODUCT] Uploading to storage...", { filePath });
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("kopi-senja-bucket")
          .upload(filePath, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("[UPDATE PRODUCT] Error uploading image:", uploadError);
          console.warn(
            "[UPDATE PRODUCT] Continuing without updating image due to upload error"
          );
        } else {
          console.log("[UPDATE PRODUCT] Upload successful:", uploadData.path);
          const { data: publicUrlData } = supabase.storage
            .from("kopi-senja-bucket")
            .getPublicUrl(uploadData.path);
          imageUrl = publicUrlData.publicUrl;
          console.log("[UPDATE PRODUCT] Public URL:", imageUrl);
        }
      }

      const updatePayload = {
        name,
        description,
        price: price !== undefined ? Number(price) : undefined,
        image: imageUrl,
        category,
        updated_at: new Date(),
      };

      // hapus kunci undefined agar tidak overwrite
      Object.keys(updatePayload).forEach(
        (k) => updatePayload[k] === undefined && delete updatePayload[k]
      );

      console.log("[UPDATE PRODUCT] Updating payload:", {
        ...updatePayload,
        image: imageUrl ? "URL provided" : "not updated",
      });
      const { data, error } = await supabase
        .from("products")
        .update(updatePayload)
        .eq("id", id)
        .select();

      if (error) {
        console.error("[UPDATE PRODUCT] Error updating:", error.message);
        return res.status(400).json({
          status: false,
          pesan: "Gagal memperbarui produk",
          error: error.message,
        });
      }

      console.log("[UPDATE PRODUCT] Success:", data[0]);
      return res.status(200).json({
        status: true,
        pesan: "Produk berhasil diperbarui",
        data: data[0],
      });
    } catch (error) {
      console.error("[UPDATE PRODUCT] Unexpected error:", error);
      return res.status(400).json({
        status: false,
        pesan: "Gagal memperbarui produk",
        error: error.message,
      });
    }
  },

  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async remove(req, res) {
    const { id } = req.params;
    console.log("[DELETE PRODUCT] id=", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Error delete:", error.message);
      return res.status(400).json({
        status: false,
        pesan: "Gagal menghapus produk",
        error: error.message,
      });
    }
    return res.status(200).json({
      status: true,
      pesan: "Produk berhasil dihapus",
    });
  },
};
