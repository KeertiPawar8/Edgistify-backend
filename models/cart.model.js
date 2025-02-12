const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
  productID: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  userID: { type: String, required: true },
});

const CartModel = mongoose.model("cart", cartSchema);

module.exports = {
  CartModel,
};
