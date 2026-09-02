const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

function toPublicUser(user) {
  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password;
  return userObject;
}

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with that email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with that email already exists.' });
    }
    return res.status(500).json({ message: 'Unable to register account.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = user && await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json({ token: createToken(user), user: toPublicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to log in.' });
  }
}

async function getMe(req, res) {
  if (!req.user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: toPublicUser(req.user) });
}

async function updateProfile(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name: name.trim() } },
    { new: true, runValidators: true },
  );

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: toPublicUser(user) });
}

async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return res.json({ message: 'Password updated successfully.' });
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
};
