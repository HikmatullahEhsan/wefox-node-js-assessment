const { User } = require('../../model/user');

const auth = require('../../middleware/auth');
const mongoose = require('mongoose');

describe('auth middleware', () => {
  it('should populate req.user with the payload of a valid JWT', () => {
    const user = { 
        user_id: mongoose.Types.ObjectId().toHexString() 
    };
    const token = new User(user).generateAuthToken();
    const req = {
      header: jest.fn().mockReturnValue(token)
    };
    const res = {};
    const next = jest.fn();
    
    auth(req, res, next);
    let decoded = req.user['user_id'];

    decoded = parseInt(decoded,16);

    expect(decoded).toBe(parseInt(user.user_id,16));
  });
});