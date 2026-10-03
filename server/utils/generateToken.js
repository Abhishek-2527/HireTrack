const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: "7d",
  });
};

module.exports = generateToken;
