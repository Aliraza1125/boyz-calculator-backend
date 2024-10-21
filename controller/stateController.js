const { stateService } = require("../service/stateService");

const stateController = async (req, res) => {
  try {
    const result = await stateService();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = stateController;
