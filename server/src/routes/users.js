const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await query(
      'SELECT id, name, email, role, "createdAt" FROM "User" WHERE id = $1',
      [req.user.id]
    );
    res.json(userRes.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

module.exports = router;
