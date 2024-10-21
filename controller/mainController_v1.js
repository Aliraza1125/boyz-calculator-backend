const mainService_v1 = require("../service/mainService_v1");

const mainController_v1 = async (req, res) => {
  try {
    const result = await mainService_v1();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};

module.exports = mainController_v1;
