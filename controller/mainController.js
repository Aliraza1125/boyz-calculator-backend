const { mainService } = require("../service/mainService");

const mainController = async (req, res) => {
  try {
    const input = req.body;

    const result = await mainService(input);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = mainController;
