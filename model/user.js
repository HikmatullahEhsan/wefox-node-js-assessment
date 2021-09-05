const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const Joi = require('joi');
require("dotenv").config();
const userSchema = new mongoose.Schema({
  fullName: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
});

userSchema.methods.generateAuthToken = function() { 
  const token = jwt.sign({ user_id: this._id }, process.env.TOKEN_KEY);
  return token;
}
const User = mongoose.model('User', userSchema);
function validateUser(user) {
  const schema = {
    fullName: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(user, schema);
}


exports.User = User; 
exports.validate = validateUser;

