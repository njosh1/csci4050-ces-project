const jwt = require("jsonwebtoken");

const TOKEN_TTL = "8h";

function signUserToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: TOKEN_TTL,
    }
  );
}

function verifyUserToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  signUserToken,
  verifyUserToken,
};
