require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mainRoute = require("./routes/mainRoute");

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json());
app.use("/api", mainRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
