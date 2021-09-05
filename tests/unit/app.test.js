const app= require('../../app');
const { User } = require('../../model/user');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

describe('JWT Token',()=>{
  it('should return a valid JWT', () => {
    const payload = { 
      user_id: new mongoose.Types.ObjectId().toString(16)
    };
    const user = new User(payload);
    const token = user.generateAuthToken();
    let decoded = jwt.verify(token, process.env.TOKEN_KEY)['user_id'];
    decoded = parseInt(decoded,16);
    expect(decoded).toBe(parseInt(payload.user_id,16));
  });
});


