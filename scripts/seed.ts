import bcrypt from 'bcrypt';
import { query, closePool } from '@festix/shared';

async function seed() {
  const adminHash = await bcrypt.hash('Admin123!', 12);
  await query(
    `UPDATE users SET password_hash = $1 WHERE email = 'admin@festix.com'`,
    [adminHash]
  );

  const superAdminHash = await bcrypt.hash('SuperAdmin123!', 12);
  await query(
    `INSERT INTO users (email, password_hash, full_name, role_id)
     SELECT $1, $2, $3, id FROM roles WHERE name = 'SUPER_ADMIN'
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       full_name = EXCLUDED.full_name,
       role_id = EXCLUDED.role_id,
       is_active = true,
       updated_at = NOW()`,
    ['superadmin@festix.com', superAdminHash, 'Festix Super Admin']
  );

  const eventId = 'b0000000-0000-0000-0000-000000000001';
  const existing = await query('SELECT COUNT(*) as cnt FROM seats WHERE event_id = $1', [eventId]);
  if (parseInt(existing.rows[0].cnt, 10) === 0) {
    const categories = [
      { rows: ['A', 'B'], category: 'VIP', price: 500 },
      { rows: ['C', 'D', 'E'], category: 'REGULAR', price: 250 },
      { rows: ['F', 'G', 'H'], category: 'ECONOMY', price: 100 },
    ];
    for (let r = 0; r < 8; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      const cat = categories.find((c) => c.rows.includes(rowLabel));
      for (let s = 1; s <= 20; s++) {
        await query(
          `INSERT INTO seats (event_id, row_label, seat_number, category, price)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
          [eventId, rowLabel, s, cat?.category || 'REGULAR', cat?.price || 250]
        );
      }
    }
    console.log('Seeded 160 seats for Summer Music Festival');
  }

  console.log('Seed complete. Admin: admin@festix.com / Admin123!');
  console.log('Seed complete. Super Admin: superadmin@festix.com / SuperAdmin123!');
  await closePool();
}

seed().catch(console.error);
