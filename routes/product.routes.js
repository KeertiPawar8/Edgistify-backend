const express = require("express");
const productRouter = express.Router();
const { ProductModel } = require("../models/product.model");
const { CartModel } = require("../models/cart.model");
const { OrderModel } = require("../models/order.model");
const { authenticate } = require("../middlewares/authenticate.middleware");

productRouter.get("/getProducts", async (req, res) => {
  const products = await ProductModel.find();
  res.send(products);
});

productRouter.post("/addToCart", authenticate, async (req, res) => {
  try {
    const { productID, userID } = req.body;
    if (!productID || !userID) {
      return res.status(400).json({ message: "Invalid productID and userID" });
    }
    const product = await ProductModel.findOne({ productID });
    if (product.status !== "available" || product.stock === 0) {
      return res.status(400).json({ message: "Product is unavailable" });
    }
    const cartItem = await CartModel.findOne({ productID, userID });
    if (cartItem) {
      return res
        .status(400)
        .json({ message: "Product already present in the Cart" });
    }
    const newCartItem = new CartModel({ productID, userID, quantity: 1 });
    await newCartItem.save();
    res.status(200).json({ message: "Product added to cart successfully!" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

productRouter.get("/getCartProducts", authenticate, async (req, res) => {
  try {
    const { userID } = req.body;
    const cartData = await CartModel.aggregate([
      { $match: { userID } },
      {
        $lookup: {
          from: "products",
          localField: "productID",
          foreignField: "productID",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productID: 1,
          name: "$productDetails.name",
          image: "$productDetails.image",
          price: "$productDetails.price",
          quantity: 1,
        },
      },
    ]);

    return res.status(200).json({ cartData });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

productRouter.delete("/removeFromCart", authenticate, async (req, res) => {
  const { productID, userID } = req.body;

  if (!productID || !userID) {
    return res
      .status(400)
      .json({ message: "productID and userID are required" });
  }
  const cartItem = await CartModel.findOne({ productID, userID });
  if (!cartItem) {
    return res.status(404).json({ error: "Cart item not found" });
  }
  await CartModel.deleteOne({ productID, userID });
  res.status(200).json({ message: "Product removed from cart successfully!" });
});

productRouter.put("/increase-quantity", authenticate, async (req, res) => {
  try {
    const { productID, userID } = req.body;

    if (!productID || !userID) {
      return res
        .status(400)
        .json({ error: "productID and userID are required" });
    }

    const cartItem = await CartModel.findOne({ productID, userID });
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    cartItem.quantity += 1;
    await cartItem.save();

    res
      .status(200)
      .json({ message: "Quantity increased by 1 successfully!", cartItem });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

productRouter.put("/decrease-quantity", authenticate, async (req, res) => {
  try {
    const { productID, userID } = req.body;

    if (!productID || !userID) {
      return res
        .status(400)
        .json({ error: "productID and userID are required" });
    }

    const cartItem = await CartModel.findOne({ productID, userID });
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    if (cartItem.quantity === 1) {
      await CartModel.deleteOne({ productID, userID });
      return res.status(200).json({
        message: "Product removed from cart as quantity reached 0",
        cartItem,
      });
    }
    cartItem.quantity -= 1;
    await cartItem.save();

    return res
      .status(200)
      .json({ message: "Quantity decreased by 1 successfully!", cartItem });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

productRouter.get("/total-price", authenticate, async (req, res) => {
  try {
    const { userID } = req.body;
    const cart = await CartModel.aggregate([
      { $match: { userID } },
      {
        $lookup: {
          from: "products",
          localField: "productID",
          foreignField: "productID",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: null,
          totalPrice: {
            $sum: {
              $multiply: ["$quantity", "$productDetails.price"],
            },
          },
        },
      },
      { $project: { _id: 0, totalPrice: 1 } },
    ]);
    res.status(200).json({ totalPrice: cart[0].totalPrice });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

productRouter.post("/place-order", authenticate, async (req, res) => {
  try {
    const { userID, shippingAddress } = req.body;
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required." });
    }
    const cart = await CartModel.aggregate([
      { $match: { userID } },
      {
        $lookup: {
          from: "products",
          localField: "productID",
          foreignField: "productID",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productID: 1,
          quantity: 1,
          price: "$productDetails.price",
          name: "$productDetails.name",
          stock: "$productDetails.stock",
        },
      },
    ]);
    const insufficientStock = cart.filter((item) => item.quantity > item.stock);
    if (insufficientStock.length > 0) {
      const productNames = insufficientStock
        .map((item) => item.name)
        .join(", ");
      return res
        .status(400)
        .json({ error: `Insufficient stock for products: ${productNames}` });
    }
    const totalPrice = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderData = {
      userID,
      products: cart,
      totalPrice,
      shippingAddress,
    };
    const newOrder = new OrderModel(orderData);
    await newOrder.save();

    for (const item of cart) {
      await ProductModel.updateOne(
        { productID: item.productID },
        { $inc: { stock: -item.quantity } }
      );
    }
    await CartModel.deleteMany({ userID });
    return res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  productRouter,
};

// http://localhost:8080/product/addToCart
// http://localhost:8080/product/decrease-quantity
// http://localhost:8080/product/total-price/67aaf1a612e012ed012f254f
