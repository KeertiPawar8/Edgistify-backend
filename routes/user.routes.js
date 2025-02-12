const { UserModel } = require("../models/user.model");
const express = require("express");
const userRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

userRouter.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    if (password.length < 8) {
      return res
        .status(200)
        .json({
          message: "password length should be minimum 8 characters",
          hasError: true,
        });
    }
    const checkuser = await UserModel.find({ email });

    if (checkuser.length > 0) {
      return res
        .status(409)
        .json({ message: "User already exist, please login" });
    } else {
      try {
        bcrypt.hash(password, 5, async (err, hash) => {
          if (err) {
            return res.status(400).json({ message: "Invalid request", err });
          }
          const user = new UserModel({ fullName, email, password: hash });
          await user.save();

          return res.status(201).json({ message: "User has been registered" });
        });
      } catch (error) {
        return res.status(400).json({ message: "Invalid request", error });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: "Invalid request", error });
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.find({ email });

  if (user.length == 0) {
    return res
      .status(404)
      .json({ message: "user does not exist, please register" });
  } else {
    bcrypt.compare(password, user[0].password, (err, result) => {
      if (result) {
        const token = jwt.sign({ userId: user[0]._id }, process.env.JWT_SECRET);
        return res.status(200).json({ token });
      } else {
        return res.status(401).send({ message: "Wrong credentials" });
      }
    });
  }
});

module.exports = {
  userRouter,
};
