const express = require('express');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all hospitals (public, with optional search/filter)
router.get('/', async (req, res) => {
  try {
    const { search, city, state, specialty, emergency, lat, lng, radius } = req.query;

    let sql = 'SELECT * FROM "Hospital" WHERE verified = true';
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR address ILIKE $${paramIndex} OR city ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (city) {
      sql += ` AND city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (state) {
      sql += ` AND state ILIKE $${paramIndex}`;
      params.push(`%${state}%`);
      paramIndex++;
    }

    if (emergency === 'true') {
      sql += ` AND emergency = true`;
    }

    if (specialty) {
      sql += ` AND $${paramIndex} = ANY(specialties)`;
      params.push(specialty);
      paramIndex++;
    }

    sql += ' ORDER BY "createdAt" DESC';

    const hospRes = await query(sql, params);
    let hospitals = hospRes.rows;

    // Distance-based filtering using Haversine formula
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = parseFloat(radius) || 50; // default 50 km

      hospitals = hospitals
        .map(h => {
          const distance = haversineDistance(userLat, userLng, h.latitude, h.longitude);
          return { ...h, distance: Math.round(distance * 10) / 10 };
        })
        .filter(h => h.distance <= maxRadius)
        .sort((a, b) => a.distance - b.distance);
    }

    res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals.' });
  }
});

// Get published slots for a hospital on a specific date
router.get('/:id/slots/:date', async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id);
    const { date } = req.params;
    
    const result = await query(
      `SELECT * FROM "HospitalSlot" 
       WHERE "hospitalId" = $1 AND "slotDate" = $2 
       ORDER BY "slotTime"`,
      [hospitalId, date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
});

// Publish slots for a hospital on a specific date (Admin only)
router.post('/:id/slots', authenticate, authorize('HOSPITAL'), async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id);
    const { date, slots } = req.body; // slots is an array of { time, capacity }

    // Verify ownership
    const hospRes = await query('SELECT "userId" FROM "Hospital" WHERE id = $1', [hospitalId]);
    if (hospRes.rows.length === 0 || hospRes.rows[0].userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    if (!date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Invalid payload.' });
    }

    // Insert new slots, ignoring duplicates
    let inserted = 0;
    for (const slot of slots) {
      try {
        await query(
          `INSERT INTO "HospitalSlot" ("hospitalId", "slotDate", "slotTime", capacity) 
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [hospitalId, date, slot.time, slot.capacity]
        );
        inserted++;
      } catch (err) {
        console.error('Error inserting slot', slot, err);
      }
    }

    res.json({ message: `Successfully published slots.`, count: inserted });
  } catch (error) {
    console.error('Publish slots error:', error);
    res.status(500).json({ error: 'Failed to publish slots.' });
  }
});

// Delete a published slot
router.delete('/:id/slots/:slotId', authenticate, authorize('HOSPITAL'), async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id);
    const slotId = parseInt(req.params.slotId);

    // Verify ownership
    const hospRes = await query('SELECT "userId" FROM "Hospital" WHERE id = $1', [hospitalId]);
    if (hospRes.rows.length === 0 || hospRes.rows[0].userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Don't delete if there are appointments booked for this slot
    // We would ideally check Appointment table, but for now we just delete the slot.
    // In a real app we'd block deletion if count(Appointments) > 0

    await query('DELETE FROM "HospitalSlot" WHERE id = $1 AND "hospitalId" = $2', [slotId, hospitalId]);
    res.json({ message: 'Slot removed successfully.' });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ error: 'Failed to remove slot.' });
  }
});

// Get single hospital by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const hospRes = await query(`
      SELECT h.*, u.name as "userName", u.email as "userEmail"
      FROM "Hospital" h
      JOIN "User" u ON h."userId" = u.id
      WHERE h.id = $1
    `, [parseInt(req.params.id)]);

    if (hospRes.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    const { userName, userEmail, ...hosp } = hospRes.rows[0];
    res.json({ ...hosp, user: { name: userName, email: userEmail } });
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ error: 'Failed to fetch hospital.' });
  }
});

// Create hospital (HOSPITAL role only)
router.post('/', authenticate, authorize('HOSPITAL'), async (req, res) => {
  try {
    const existingCheck = await query('SELECT 1 FROM "Hospital" WHERE "userId" = $1', [req.user.id]);

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a hospital registered.' });
    }

    const {
      name, description, address, city, state, phone, email,
      website, latitude, longitude, specialties, beds, emergency, isGovernment, imageUrl,
      openingTime, closingTime, slotDuration, slotCapacity
    } = req.body;

    if (!name || !address || !city || !state || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, address, city, state, and coordinates are required.' });
    }

    const insertRes = await query(`
      INSERT INTO "Hospital" (
        name, description, address, city, state, phone, email,
        website, latitude, longitude, specialties, beds, emergency, "isGovernment", "imageUrl", "userId",
        "openingTime", "closingTime", "slotDuration", "slotCapacity"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      name, description, address, city, state, phone, email,
      website, parseFloat(latitude), parseFloat(longitude), specialties || [],
      parseInt(beds) || 0, emergency || false, isGovernment || false, imageUrl, req.user.id,
      openingTime || '09:00', closingTime || '17:00', parseInt(slotDuration) || 60, parseInt(slotCapacity) || 5
    ]);

    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: 'Failed to create hospital.' });
  }
});

// Update hospital (owner or admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const hospId = parseInt(req.params.id);
    const existingCheck = await query('SELECT "userId" FROM "Hospital" WHERE id = $1', [hospId]);

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    const existingUserId = existingCheck.rows[0].userId;

    if (existingUserId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this hospital.' });
    }

    const {
      name, description, address, city, state, phone, email,
      website, latitude, longitude, specialties, beds, emergency, isGovernment, imageUrl,
      openingTime, closingTime, slotDuration, slotCapacity
    } = req.body;

    // Use coalesce to keep fields that weren't supplied. 
    // Parameter counts will get long but manageable for this size.
    const updateRes = await query(`
      UPDATE "Hospital" SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        phone = COALESCE($6, phone),
        email = COALESCE($7, email),
        website = COALESCE($8, website),
        latitude = COALESCE($9, latitude),
        longitude = COALESCE($10, longitude),
        specialties = COALESCE($11, specialties),
        beds = COALESCE($12, beds),
        emergency = COALESCE($13, emergency),
        "isGovernment" = COALESCE($14, "isGovernment"),
        "imageUrl" = COALESCE($15, "imageUrl"),
        "openingTime" = COALESCE($16, "openingTime"),
        "closingTime" = COALESCE($17, "closingTime"),
        "slotDuration" = COALESCE($18, "slotDuration"),
        "slotCapacity" = COALESCE($19, "slotCapacity"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *
    `, [
      name, description, address, city, state, phone, email,
      website, latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null, specialties,
      beds ? parseInt(beds) : null, 
      emergency !== undefined ? emergency : null,
      isGovernment !== undefined ? isGovernment : null,
      imageUrl, openingTime, closingTime, 
      slotDuration ? parseInt(slotDuration) : null, 
      slotCapacity ? parseInt(slotCapacity) : null, 
      hospId
    ]);

    res.json(updateRes.rows[0]);
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({ error: 'Failed to update hospital.' });
  }
});

// Delete hospital (owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const hospId = parseInt(req.params.id);
    const existingCheck = await query('SELECT "userId" FROM "Hospital" WHERE id = $1', [hospId]);

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    if (existingCheck.rows[0].userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this hospital.' });
    }

    await query('DELETE FROM "Hospital" WHERE id = $1', [hospId]);
    res.json({ message: 'Hospital deleted successfully.' });
  } catch (error) {
    console.error('Delete hospital error:', error);
    res.status(500).json({ error: 'Failed to delete hospital.' });
  }
});

// Get my hospital (for HOSPITAL role user)
router.get('/my/profile', authenticate, authorize('HOSPITAL'), async (req, res) => {
  try {
    const hospRes = await query('SELECT * FROM "Hospital" WHERE "userId" = $1', [req.user.id]);
    res.json(hospRes.rows.length > 0 ? hospRes.rows[0] : null);
  } catch (error) {
    console.error('Get my hospital error:', error);
    res.status(500).json({ error: 'Failed to fetch hospital profile.' });
  }
});



// Haversine formula to calculate distance between two coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Upload hospital image
router.post('/upload-image', authenticate, authorize('HOSPITAL', 'ADMIN'), (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });
});

module.exports = router;
