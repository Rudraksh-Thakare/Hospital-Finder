const express = require('express');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsersRes = await query('SELECT COUNT(*) FROM "User"');
    const totalHospitalsRes = await query('SELECT COUNT(*) FROM "Hospital"');
    const totalPatientsRes = await query('SELECT COUNT(*) FROM "User" WHERE role = $1', ['PATIENT']);
    const pendingVerificationRes = await query('SELECT COUNT(*) FROM "Hospital" WHERE verified = false');

    res.json({
      totalUsers: parseInt(totalUsersRes.rows[0].count),
      totalHospitals: parseInt(totalHospitalsRes.rows[0].count),
      totalPatients: parseInt(totalPatientsRes.rows[0].count),
      pendingVerification: parseInt(pendingVerificationRes.rows[0].count)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const usersRes = await query('SELECT id, name, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC');
    res.json(usersRes.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    await query('DELETE FROM "User" WHERE id = $1', [userId]);
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Get all hospitals (including unverified)
router.get('/hospitals', async (req, res) => {
  try {
    const hospRes = await query(`
      SELECT h.*, u.name as "userName", u.email as "userEmail"
      FROM "Hospital" h
      JOIN "User" u ON h."userId" = u.id
      ORDER BY h."createdAt" DESC
    `);
    
    // Map to expected frontend structure { ...hospitalInfo, user: { name, email } }
    const hospitals = hospRes.rows.map(h => {
      const { userName, userEmail, ...hosp } = h;
      return { ...hosp, user: { name: userName, email: userEmail } };
    });

    res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals.' });
  }
});

// Verify/unverify hospital
router.patch('/hospitals/:id/verify', async (req, res) => {
  try {
    const hospId = parseInt(req.params.id);
    const existing = await query('SELECT verified FROM "Hospital" WHERE id = $1', [hospId]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    const updated = await query(
      'UPDATE "Hospital" SET verified = $1 WHERE id = $2 RETURNING *',
      [!existing.rows[0].verified, hospId]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Verify hospital error:', error);
    res.status(500).json({ error: 'Failed to verify hospital.' });
  }
});

// Delete hospital
router.delete('/hospitals/:id', async (req, res) => {
  try {
    await query('DELETE FROM "Hospital" WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ message: 'Hospital deleted successfully.' });
  } catch (error) {
    console.error('Delete hospital error:', error);
    res.status(500).json({ error: 'Failed to delete hospital.' });
  }
});

module.exports = router;
