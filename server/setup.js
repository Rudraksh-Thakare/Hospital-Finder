const { pool } = require('./src/db');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('Setting up database tables...');

  try {
    // Drop existing tables just to be totally sure (since we used prisma before)
    await pool.query('DROP TABLE IF EXISTS "Hospital" CASCADE');
    await pool.query('DROP TABLE IF EXISTS "User" CASCADE');
    
    // Create Users Table
    await pool.query(`
      CREATE TABLE "User" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'PATIENT',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Hospitals Table
    await pool.query(`
      CREATE TABLE "Hospital" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        specialties TEXT[],
        beds INTEGER DEFAULT 0,
        emergency BOOLEAN DEFAULT false,
        isGovernment BOOLEAN DEFAULT false,
        verified BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE
      )
    `);

    console.log('Tables created successfully.');

    // Seed Data
    console.log('Inserting seed data...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const hospitalPassword = await bcrypt.hash('hospital123', 10);
    const patientPassword = await bcrypt.hash('patient123', 10);

    // 1. Setup Admin
    await pool.query(
      `INSERT INTO "User" (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      ['Admin', 'admin@hospitalfinder.com', adminPassword, 'ADMIN']
    );

    // 2. Setup Patient
    await pool.query(
      `INSERT INTO "User" (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      ['Rudraksh Thakare', 'patient@example.com', patientPassword, 'PATIENT']
    );

    // 3. Setup Hospitals
    const hospitals = [
      {
        userName: 'City Hospital Admin',
        userEmail: 'cityhospital@example.com',
        h: { name: 'City General Hospital', desc: 'A premier multi-specialty hospital...', address: '123 Medical Avenue, Civil Lines', city: 'Nagpur', state: 'Maharashtra', phone: '+91 712 2551234', email: 'info@citygeneralhospital.com', website: 'https://citygeneralhospital.com', lat: 21.1458, lng: 79.0882, spec: ['Cardiology', 'Orthopedics', 'Pediatrics'], beds: 350, emergency: true, verified: true }
      },
      {
        userName: 'Orange City Hospital',
        userEmail: 'orangecity@example.com',
        h: { name: 'Orange City Hospital & Research Institute', desc: 'Leading hospital in Central India.', address: '19, Vayusena Nagar', city: 'Nagpur', state: 'Maharashtra', phone: '+91 712 2234567', email: null, website: null, lat: 21.1332, lng: 79.0514, spec: ['Oncology', 'Cardiology'], beds: 280, emergency: true, verified: true }
      }
    ];

    for (const item of hospitals) {
      const userRes = await pool.query(
        `INSERT INTO "User" (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        [item.userName, item.userEmail, hospitalPassword, 'HOSPITAL']
      );
      const userId = userRes.rows[0].id;

      await pool.query(
        `INSERT INTO "Hospital" (name, description, address, city, state, phone, email, website, latitude, longitude, specialties, beds, emergency, verified, "userId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [item.h.name, item.h.desc, item.h.address, item.h.city, item.h.state, item.h.phone, item.h.email, item.h.website, item.h.lat, item.h.lng, item.h.spec, item.h.beds, item.h.emergency, item.h.verified, userId]
      );
    }

    console.log('Seed completed successfully!');
    console.log('\nSample Logins:');
    console.log('Admin    -> admin@hospitalfinder.com / admin123');
    console.log('Hospital -> cityhospital@example.com / hospital123');
    console.log('Patient  -> patient@example.com / patient123');

  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    pool.end();
  }
}

setupDatabase();
