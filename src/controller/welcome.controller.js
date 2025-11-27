export default {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  Welcome(req, res) {
    res.status(200).json({
      message: "Welcome to the backend Kopi Senja API",
    });
  },
};
