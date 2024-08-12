const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Existing Google authentication routes...

router.post('/add-password', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, googleId: { $exists: true }, password: { $exists: false } });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found or already has a password' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
  
      res.json({ message: 'Password added successfully' });
    } catch (error) {
      next(error);
    }
  });
  
  // Modify the login route to handle Google-authenticated users without passwords
  router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      if (user.googleId && !user.password) {
        return res.status(409).json({ message: 'Google account detected. Please set a password or use Google Sign-In.' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ user: { id: user._id, name: user.name, email: user.email } });
      });
    } catch (error) {
      next(error);
    }
  });

// Registration
router.post('/register', [
  body('name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;