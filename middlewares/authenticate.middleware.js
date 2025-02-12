const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (decoded) {
        req.body.userID = decoded.userId;
        next();
      } else {
        return res.status(401).json({ message: "Invalid Token" });
      }
    });
  } else {
    return res.status(401).json({ message: "Please login first" });
  }
};

module.exports = {
  authenticate,
};
