const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// Helper to format time strings from DB (which are HH:MM:SS) to HH:MM
const formatTime = (timeStr) => timeStr.substring(0, 5);



// 1. Patient: Book a new appointment
router.post('/', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const patientId = req.user.id; // user id from DB
    const { hospitalId, appointmentDate, appointmentTime, patientName, contactNumber, age, gender, address } = req.body;

    if (!hospitalId || !appointmentDate || !appointmentTime || !patientName || !contactNumber || !age || !gender) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify the slot is actually published in HospitalSlot
    const slotCheck = await pool.query(
      `SELECT capacity FROM "HospitalSlot" WHERE "hospitalId" = $1 AND "slotDate" = $2 AND "slotTime" = $3`,
      [hospitalId, appointmentDate, appointmentTime]
    );

    if (slotCheck.rows.length === 0) {
      return res.status(400).json({ message: 'The selected time slot is not available or has not been published.' });
    }

    const slotCapacity = slotCheck.rows[0].capacity;

    // Check how many appointments already exist for this slot
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM "Appointment" 
       WHERE "hospitalId" = $1 AND "appointmentDate" = $2 AND "appointmentTime" = $3 AND status != 'CANCELLED'`,
      [hospitalId, appointmentDate, appointmentTime]
    );

    const currentBookings = parseInt(countRes.rows[0].count);

    if (currentBookings >= slotCapacity) {
      return res.status(400).json({ message: 'This slot is already fully booked.' });
    }

    const result = await pool.query(
      `INSERT INTO "Appointment" ("patientId", "hospitalId", "appointmentDate", "appointmentTime", status, "patientName", "contactNumber", age, gender, address)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, $9) RETURNING *`,
      [patientId, hospitalId, appointmentDate, appointmentTime, patientName, contactNumber, parseInt(age), gender, address]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Patient: Get available slots for a specific date
router.get('/slots', async (req, res) => {
  try {
    const { hospitalId, date } = req.query;

    if (!hospitalId || !date) {
      return res.status(400).json({ message: 'Hospital ID and date are required' });
    }

    // Get published slots from HospitalSlot table
    const slotsRes = await pool.query(
      `SELECT "slotTime" as time, capacity FROM "HospitalSlot" 
       WHERE "hospitalId" = $1 AND "slotDate" = $2
       ORDER BY "slotTime"`,
      [hospitalId, date]
    );

    if (slotsRes.rows.length === 0) {
      return res.json([]); // No slots published for this day
    }

    // Get booking counts for this date
    const countRes = await pool.query(
      `SELECT "appointmentTime", COUNT(*) as count 
       FROM "Appointment" 
       WHERE "hospitalId" = $1 AND "appointmentDate" = $2 AND status != 'CANCELLED'
       GROUP BY "appointmentTime"`,
      [hospitalId, date]
    );

    const slotCounts = {};
    countRes.rows.forEach(row => {
      slotCounts[formatTime(row.appointmentTime)] = parseInt(row.count);
    });

    // Check if the requested date is today
    const now = new Date();
    const isToday = new Date(date).toDateString() === now.toDateString();
    const currentHourStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const formattedSlots = slotsRes.rows.map(slot => {
      const time = formatTime(slot.time);
      const capacity = slot.capacity;
      const count = slotCounts[time] || 0;
      let available = count < capacity;
      
      // If the date is today, disable past slots
      if (isToday && time <= currentHourStr) {
        available = false;
      }

      return {
        time,
        available,
        capacity,
        booked: count
      };
    });

    res.json(formattedSlots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Patient: Get my appointments
router.get('/my-appointments', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const result = await pool.query(`
      SELECT a.*, h.name as "hospitalName", h.city as "hospitalCity"
      FROM "Appointment" a
      JOIN "Hospital" h ON a."hospitalId" = h.id
      WHERE a."patientId" = $1
      ORDER BY a."appointmentDate" DESC, a."appointmentTime" DESC
    `, [patientId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Hospital: Get appointments for the logged-in hospital
router.get('/hospital-appointments', authenticate, authorize('HOSPITAL'), async (req, res) => {
  try {
    const hospitalUserId = req.user.id;
    
    // Find the hospital record
    const hospitalRes = await pool.query(`SELECT id FROM "Hospital" WHERE "userId" = $1`, [hospitalUserId]);
    if (hospitalRes.rows.length === 0) {
      return res.status(404).json({ message: 'Hospital not found for this user' });
    }
    const hospitalId = hospitalRes.rows[0].id;

    // Get appointments
    const result = await pool.query(`
      SELECT a.*, u.name as "accountHolderName", u.email as "patientEmail"
      FROM "Appointment" a
      JOIN "User" u ON a."patientId" = u.id
      WHERE a."hospitalId" = $1
      ORDER BY a."appointmentDate" DESC, a."appointmentTime" DESC
    `, [hospitalId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hospital appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Hospital: Update appointment status
router.put('/:id/status', authenticate, authorize('HOSPITAL'), async (req, res) => {
  try {
    const hospitalUserId = req.user.id;
    const appointmentId = req.params.id;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify hospital owns this appointment
    const hospitalRes = await pool.query(`SELECT id FROM "Hospital" WHERE "userId" = $1`, [hospitalUserId]);
    if (hospitalRes.rows.length === 0) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    const hospitalId = hospitalRes.rows[0].id;

    const aptRes = await pool.query(`SELECT id FROM "Appointment" WHERE id = $1 AND "hospitalId" = $2`, [appointmentId, hospitalId]);
    if (aptRes.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized' });
    }

    const updated = await pool.query(
      `UPDATE "Appointment" SET status = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, appointmentId]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
