const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    userID: { type: String, required: true },
    products: [
      {
        name:{type:String,required:true},
        productID: { type: String, required: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true },
    
      },
    ],
    totalPrice: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered"],
      default: "Pending",
    },
  },
  { timestamps: true }
);
const OrderModel = mongoose.model("order", orderSchema);
module.exports = {
  OrderModel,
};
