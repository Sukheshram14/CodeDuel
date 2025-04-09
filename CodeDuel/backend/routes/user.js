const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user.stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 