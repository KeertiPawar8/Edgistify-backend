const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  productID: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ["available", "out_of_stock", "discontinued"],
    default: "available",
  },
});

const ProductModel = mongoose.model("product", productSchema);

module.exports = {
  ProductModel,
};
