const express = require("express");
const mainController = require("../controller/mainController");
// const stateController = require("../controller/stateController");
const mainController_v1 = require("../controller/mainController_v1");

const router = express.Router();

router.post("/calculate", mainController);
// router.get("/states", stateController);

router.get("/calculate_v1", mainController_v1);

module.exports = router;
