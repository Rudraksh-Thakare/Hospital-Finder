const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');
const uploadDoc = require('../middleware/uploadDoc');

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await query(
      'SELECT id, name, email, role, "createdAt", "shareToken" FROM "User" WHERE id = $1',
      [req.user.id]
    );
    res.json(userRes.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Get patient profile details
router.get('/profile', authenticate, async (req, res) => {
  try {
    const profileRes = await query(
      `SELECT * FROM "PatientProfile" WHERE "userId" = $1`,
      [req.user.id]
    );
    res.json(profileRes.rows[0] || {});
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile.' });
  }
});

// Update patient profile details
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { age, gender, bloodGroup, phone, address } = req.body;
    
    const existing = await query(`SELECT id FROM "PatientProfile" WHERE "userId" = $1`, [req.user.id]);
    
    if (existing.rows.length > 0) {
      await query(
        `UPDATE "PatientProfile" SET age=$1, gender=$2, "bloodGroup"=$3, phone=$4, address=$5 WHERE "userId" = $6`,
        [age, gender, bloodGroup, phone, address, req.user.id]
      );
    } else {
      await query(
        `INSERT INTO "PatientProfile" ("userId", age, gender, "bloodGroup", phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, age, gender, bloodGroup, phone, address]
      );
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ error: 'Failed to update patient profile.' });
  }
});

// Upload a document
router.post('/documents', authenticate, uploadDoc.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: 'File and title are required.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;

    const docRes = await query(
      `INSERT INTO "MedicalDocument" ("userId", title, "fileUrl", "fileType")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title, fileUrl, fileType]
    );

    res.status(201).json(docRes.rows[0]);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
});

// Get user documents
router.get('/documents', authenticate, async (req, res) => {
  try {
    const docRes = await query(
      `SELECT * FROM "MedicalDocument" WHERE "userId" = $1 ORDER BY "uploadedAt" DESC`,
      [req.user.id]
    );
    res.json(docRes.rows);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});

// Delete a document
router.delete('/documents/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    // We should ideally also delete the file from the filesystem, but skipping for simplicity
    await query(
      `DELETE FROM "MedicalDocument" WHERE id = $1 AND "userId" = $2`,
      [id, req.user.id]
    );
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// Generate/Get Share Token
router.post('/share', authenticate, async (req, res) => {
  try {
    let userRes = await query(`SELECT "shareToken" FROM "User" WHERE id = $1`, [req.user.id]);
    let token = userRes.rows[0]?.shareToken;

    if (!token) {
      token = crypto.randomUUID();
      await query(`UPDATE "User" SET "shareToken" = $1 WHERE id = $2`, [token, req.user.id]);
    }

    res.json({ shareToken: token });
  } catch (error) {
    console.error('Share profile error:', error);
    res.status(500).json({ error: 'Failed to generate share token.' });
  }
});

// Public Route: Get Shared Profile by Token
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user
    const userRes = await query(
      `SELECT id, name FROM "User" WHERE "shareToken" = $1`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found or link is invalid.' });
    }

    const userId = userRes.rows[0].id;
    const userName = userRes.rows[0].name;

    // Get their documents
    const docRes = await query(
      `SELECT id, title, "fileUrl", "fileType", "uploadedAt" FROM "MedicalDocument" WHERE "userId" = $1 ORDER BY "uploadedAt" DESC`,
      [userId]
    );

    // Get patient profile info
    const profileRes = await query(
      `SELECT age, gender, "bloodGroup", phone, address, "emergencyContact", "medicalNotes" FROM "PatientProfile" WHERE "userId" = $1`,
      [userId]
    );

    res.json({
      name: userName,
      documents: docRes.rows,
      profile: profileRes.rows[0] || null
    });
  } catch (error) {
    console.error('Fetch shared profile error:', error);
    res.status(500).json({ error: 'Failed to fetch shared profile.' });
  }
});

module.exports = router;
