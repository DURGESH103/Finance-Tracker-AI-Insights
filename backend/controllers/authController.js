const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({
    name,
    email,
    password,
    accounts: [{ name: 'Primary Bank', type: 'bank', balance: 0 }],
  });

  res.status(201).json({ token: signToken(user._id), user: { id: user._id, name, email } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, email } });
};

exports.googleAuth = async (req, res) => {
  const { googleId, email, name, avatar } = req.body;
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      googleId, email, name, avatar,
      accounts: [{ name: 'Primary Bank', type: 'bank', balance: 0 }],
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    await user.save();
  }

  res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, email } });
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};
