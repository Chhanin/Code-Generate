const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const saltRounds = 10;

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if user already exists
      const userExists = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (userExists) {
        return res.status(400).json({ errors: [{ msg: 'User with that email or username already exists' }] });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user into the database
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function (err) {
          if (err) {
            console.error('Error registering user:', err);
            return res.status(500).json({ errors: [{ msg: 'Server error during registration' }] });
          }
          // For now, just send a success message
          // Later, we'll implement JWT and send a token
          res.status(201).json({ success: true, message: 'User registered successfully' });
        }
      );
    } catch (error) {
      console.error('Error during registration process:', error);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Create and sign a JWT
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your_default_secret',
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error('Error during login process:', error);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

module.exports = router;
