import supabase from "../utils/supabase/client.js";

const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
};

const ORDER_SELECT = `
  id,
  customer_name,
  payment_method,
  status,
  total_amount,
  meja_id,
  created_at,
  updated_at,
  meja:meja_id (
    id,
    nomor_meja
  ),
  order_items:order_items (
    id,
    quantity,
    product:product_id (
      id,
      name,
      price,
      image,
      category
    )
  )
`;

function calculateTotal(items = []) {
  return items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return acc + price * qty;
  }, 0);
}

export default {
  async create(req, res) {
    try {
      const {
        customer_name,
        meja_id,
        meja_nomor,
        payment_method = "tunai",
        items = [],
      } = req.body;

      if (!customer_name || !String(customer_name).trim()) {
        return res.status(400).json({
          status: false,
          pesan: "Nama pemesan wajib diisi",
        });
      }

      if (!meja_id && !meja_nomor) {
        return res.status(400).json({
          status: false,
          pesan: "Nomor meja wajib dipilih",
        });
      }

      if (!items.length) {
        return res.status(400).json({
          status: false,
          pesan: "Keranjang tidak boleh kosong",
        });
      }

      const sanitizedItems = items.map((item) => ({
        product_id: Number(item.product_id || item.id),
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
      }));

      if (
        sanitizedItems.some((item) => !item.product_id || item.quantity <= 0)
      ) {
        return res.status(400).json({
          status: false,
          pesan: "Item pesanan tidak valid",
        });
      }

      const totalAmount = calculateTotal(sanitizedItems);

      let mejaData = null;
      let tableId = meja_id ? Number(meja_id) : null;

      if (tableId) {
        const { data, error } = await supabase
          .from("meja")
          .select("id, nomor_meja")
          .eq("id", tableId)
          .maybeSingle();
        if (error) {
          console.error("Error mengambil data meja:", error.message);
        }
        mejaData = data;
      } else if (meja_nomor) {
        const nomorTrimmed = String(meja_nomor).trim();
        const { data, error } = await supabase
          .from("meja")
          .select("id, nomor_meja")
          .eq("nomor_meja", nomorTrimmed)
          .maybeSingle();

        if (error) {
          console.error("Error mencari meja:", error.message);
        }

        if (data) {
          mejaData = data;
          tableId = data.id;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("meja")
            .insert([{ nomor_meja: nomorTrimmed }])
            .select("id, nomor_meja")
            .single();

          if (insertError) {
            console.error("Gagal membuat meja baru:", insertError.message);
            return res.status(500).json({
              status: false,
              pesan: "Gagal menambahkan nomor meja",
              error: insertError.message,
            });
          }

          mejaData = inserted;
          tableId = inserted.id;
        }
      }

      if (!mejaData || !tableId) {
        return res.status(400).json({
          status: false,
          pesan: "Nomor meja tidak ditemukan",
        });
      }

      const orderPayload = {
        customer_name,
        meja_id: tableId,
        payment_method,
        status: ORDER_STATUS.PENDING,
        total_amount: totalAmount,
      };

      const { data: orderData, error: orderError } = await supabase
        .from("pesanan")
        .insert([orderPayload])
        .select("id")
        .single();

      if (orderError) {
        console.error("Gagal membuat pesanan:", orderError.message);
        return res.status(500).json({
          status: false,
          pesan: "Gagal membuat pesanan",
          error: orderError.message,
        });
      }

      const orderItemsPayload = sanitizedItems.map((item) => ({
        pesanan_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);

      if (itemsError) {
        console.error("Gagal menyimpan detail pesanan:", itemsError.message);
        await supabase.from("pesanan").delete().eq("id", orderData.id);
        return res.status(500).json({
          status: false,
          pesan: "Gagal menyimpan detail pesanan",
          error: itemsError.message,
        });
      }

      return res.status(201).json({
        status: true,
        pesan: "Pesanan berhasil dibuat",
        data: {
          id: orderData.id,
          status: ORDER_STATUS.PENDING,
        },
      });
    } catch (error) {
      console.error("Unexpected error create order:", error);
      return res.status(500).json({
        status: false,
        pesan: "Terjadi kesalahan saat membuat pesanan",
        error: error.message,
      });
    }
  },

  async list(req, res) {
    try {
      const { status } = req.query;

      const query = supabase
        .from("pesanan")
        .select(ORDER_SELECT)
        .order("created_at", { ascending: false });

      if (status) {
        query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Gagal mengambil daftar pesanan:", error.message);
        return res.status(500).json({
          status: false,
          pesan: "Gagal mengambil daftar pesanan",
          error: error.message,
        });
      }

      return res.status(200).json({
        status: true,
        pesan: "Berhasil mengambil daftar pesanan",
        data,
      });
    } catch (error) {
      console.error("Unexpected error list orders:", error);
      return res.status(500).json({
        status: false,
        pesan: "Terjadi kesalahan saat mengambil pesanan",
        error: error.message,
      });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("pesanan")
        .select(ORDER_SELECT)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Pesanan tidak ditemukan:", error.message);
        return res.status(404).json({
          status: false,
          pesan: "Pesanan tidak ditemukan",
          error: error.message,
        });
      }

      return res.status(200).json({
        status: true,
        pesan: "Berhasil mengambil detail pesanan",
        data,
      });
    } catch (error) {
      console.error("Unexpected error get order detail:", error);
      return res.status(500).json({
        status: false,
        pesan: "Terjadi kesalahan saat mengambil detail pesanan",
        error: error.message,
      });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(ORDER_STATUS).includes(status)) {
        return res.status(400).json({
          status: false,
          pesan: "Status pesanan tidak valid",
        });
      }

      const { data, error } = await supabase
        .from("pesanan")
        .update({ status, updated_at: new Date() })
        .eq("id", id)
        .select("id, status")
        .single();

      if (error) {
        console.error("Gagal memperbarui status:", error.message);
        return res.status(500).json({
          status: false,
          pesan: "Gagal memperbarui status pesanan",
          error: error.message,
        });
      }

      return res.status(200).json({
        status: true,
        pesan: "Status pesanan berhasil diperbarui",
        data,
      });
    } catch (error) {
      console.error("Unexpected error update status:", error);
      return res.status(500).json({
        status: false,
        pesan: "Terjadi kesalahan saat memperbarui status",
        error: error.message,
      });
    }
  },
};

export { ORDER_STATUS };
