const express = require("express");
const { connection } = require("./db");
const app = express();
app.use(express.json());
require("dotenv").config();
const { userRouter } = require("./routes/user.routes");
const { productRouter } = require("./routes/product.routes");
const { authenticate } = require("./middlewares/authenticate.middleware");

app.get("/", (req, res) => {
  res.send("keerti");
});
app.use("/user", userRouter);
app.use(authenticate);
app.use("/product",productRouter)

app.listen(process.env.port, async () => {
  await connection;
  console.log(`server is running at port ${process.env.port}`);
});
