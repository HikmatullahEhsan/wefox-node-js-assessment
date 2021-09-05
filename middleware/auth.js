const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
  const token =  req.header('x-auth-token') || req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return  res.status(403).json({msg: "A token is required for authentication", code:403});
  }
  try {
    const decoded = jwt.verify(token, config.TOKEN_KEY);
    req.user = decoded;
    next();

  } catch (err) {
    res.status(401).json({msg: "Invalid Token", code:401});
  }
  // return next();
};

module.exports = verifyToken;
