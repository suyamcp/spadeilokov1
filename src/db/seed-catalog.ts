import { db } from './index.ts';
import { roomTypes, rooms } from './schema.ts';

async function seedCatalog() {
  const existing = await db.select().from(roomTypes);
  if (existing.length > 0) {
    console.log('room_types already has data — skipping. Delete existing rows first if you want to reseed.');
    process.exit(0);
  }

  const catalog = [
    { slug: 'luxury-cabin', name: 'Glass-Front Luxury Cabin', baseRate: '4999', capacity: 2, count: 4, prefix: 'LC' },
    { slug: 'deluxe-glamping', name: 'Deluxe Glamping Suite Tent', baseRate: '3200', capacity: 4, count: 8, prefix: 'DG' },
    { slug: 'standard-pitching', name: 'Premium Adventure Pitching Site', baseRate: '1200', capacity: 2, count: 15, prefix: 'SP' },
  ];

  for (const item of catalog) {
    const [inserted] = await db.insert(roomTypes).values({
      slug: item.slug,
      name: item.name,
      baseRate: item.baseRate,
      capacity: item.capacity,
    }).returning();

    for (let i = 1; i <= item.count; i++) {
      await db.insert(rooms).values({
        roomNumber: `${item.prefix}-${String(i).padStart(2, '0')}`,
        roomTypeId: inserted.id,
        status: 'available',
      });
    }
    console.log(`Seeded ${item.count} rooms for ${item.name}`);
  }
  process.exit(0);
}
seedCatalog();
