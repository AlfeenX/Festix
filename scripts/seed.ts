import bcrypt from 'bcrypt';
import { query, closePool } from '@festix/shared';

const VENUE_COUNT = 50;
const EVENT_COUNT = 100;

const cities = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali',
  'Medan', 'Makassar', 'Semarang', 'Malang', 'Tangerang',
];

const venueNames = [
  'Arena', 'Convention Hall', 'Stadium', 'Expo Center', 'Concert Hall',
  'Culture Dome', 'Music Park', 'Grand Theatre', 'Festival Grounds', 'Auditorium',
];

const eventPrefixes = [
  'Nusantara Sound', 'Jakarta Night Live', 'Electric Horizon', 'Indie Weekend',
  'Jazz Kota', 'Pop Parade', 'Rock District', 'Acoustic Sunset',
  'Festival Rasa', 'Symphony Live',
];

function stableUuid(prefix: 'a' | 'b', index: number) {
  return `${prefix}0000000-0000-0000-0000-${String(index).padStart(12, '0')}`;
}

async function seedUsers() {
  const adminHash = await bcrypt.hash('Admin123!', 12);
  await query(
    `UPDATE users SET password_hash = $1 WHERE email = 'admin@festix.com'`,
    [adminHash]
  );

  const superAdminHash = await bcrypt.hash('Superadmin123!', 12);
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
}

async function seedVenues() {
  for (let i = 1; i <= VENUE_COUNT; i++) {
    const city = cities[(i - 1) % cities.length];
    const kind = venueNames[(i - 1) % venueNames.length];
    await query(
      `INSERT INTO venues (id, name, address, city, capacity)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         address = EXCLUDED.address,
         city = EXCLUDED.city,
         capacity = EXCLUDED.capacity`,
      [
        stableUuid('a', i),
        `${city} ${kind} ${Math.ceil(i / venueNames.length)}`,
        `Jl. Festix No. ${i}, ${city}`,
        city,
        500 + (i % 10) * 250,
      ]
    );
  }
}

async function seedEvents() {
  for (let i = 1; i <= EVENT_COUNT; i++) {
    const venueId = stableUuid('a', ((i - 1) % VENUE_COUNT) + 1);
    const startsAt = new Date(Date.UTC(2026, 5 + (i % 7), 1 + (i % 26), 12 + (i % 8), 0, 0));
    const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    const title = `${eventPrefixes[(i - 1) % eventPrefixes.length]} ${2026 + Math.floor((i - 1) / 50)} #${String(i).padStart(3, '0')}`;

    await query(
      `INSERT INTO events (id, title, description, venue_id, starts_at, ends_at, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         venue_id = EXCLUDED.venue_id,
         starts_at = EXCLUDED.starts_at,
         ends_at = EXCLUDED.ends_at,
         is_published = EXCLUDED.is_published,
         updated_at = NOW()`,
      [
        stableUuid('b', i),
        title,
        `Event konser Festix dengan harga tiket Rupiah dan kapasitas kursi terkelola.`,
        venueId,
        startsAt,
        endsAt,
      ]
    );
  }
}

async function seedSeats() {
  const categories = [
    { rows: ['A', 'B'], category: 'VIP', price: 750000 },
    { rows: ['C', 'D', 'E'], category: 'REGULAR', price: 350000 },
    { rows: ['F', 'G', 'H'], category: 'ECONOMY', price: 150000 },
  ];

  for (let i = 1; i <= EVENT_COUNT; i++) {
    const eventId = stableUuid('b', i);
    for (let r = 0; r < 8; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      const cat = categories.find((c) => c.rows.includes(rowLabel)) || categories[1];
      for (let s = 1; s <= 20; s++) {
        await query(
          `INSERT INTO seats (event_id, row_label, seat_number, category, price)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (event_id, row_label, seat_number) DO UPDATE SET
             category = EXCLUDED.category,
             price = EXCLUDED.price`,
          [eventId, rowLabel, s, cat.category, cat.price]
        );
      }
    }
  }
}

async function seed() {
  await seedUsers();
  await seedVenues();
  await seedEvents();
  await seedSeats();

  console.log(`Seed complete. Venues: ${VENUE_COUNT}, events: ${EVENT_COUNT}, seats: ${EVENT_COUNT * 160}.`);
  console.log('Seed complete. Admin: admin@festix.com / Admin123!');
  console.log('Seed complete. Super Admin: superadmin@festix.com / Superadmin123!');
  await closePool();
}

seed().catch(async (error) => {
  console.error(error);
  await closePool();
  process.exit(1);
});
