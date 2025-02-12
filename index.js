const express = require("express");
const cors = require("cors");
const { connection } = require("./db");
const app = express();
app.use(express.json());
app.use(cors());
require("dotenv").config();
const { userRouter } = require("./routes/user.routes");
const { productRouter } = require("./routes/product.routes");
// const { authenticate } = require("./middlewares/authenticate.middleware");

app.get("/", (req, res) => {
  res.send("Home Page");
});
app.use("/user", userRouter);
// app.use(authenticate);
app.use("/product",productRouter)

app.listen(process.env.port, async () => {
  await connection;
  console.log(`server is running at port ${process.env.port}`);
});
