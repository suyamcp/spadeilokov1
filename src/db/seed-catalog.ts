import { db } from './index.ts';
import { roomTypes, rooms } from './schema.ts';
import { SPA_PACKAGES, BRANCHES, BRANCH_CODES } from '../data.ts';

const PACKAGE_PREFIX: Record<string, string> = {
  'signature-suite': 'SG',
  'deluxe-room': 'DX',
  'classic-room': 'CL',
};

async function seedCatalog() {
  const existing = await db.select().from(roomTypes);
  if (existing.length > 0) {
    console.log('room_types already has data — skipping. Delete existing rows first if you want to reseed.');
    process.exit(0);
  }

  for (const pkg of SPA_PACKAGES) {
    const [inserted] = await db.insert(roomTypes).values({
      slug: pkg.id,
      name: pkg.name,
      baseRate: String(pkg.price),
      capacity: pkg.capacity,
    }).returning();

    // Every branch runs its own set of treatment rooms for each package, so
    // availability at one location never consumes another location's inventory.
    for (const branch of BRANCHES) {
      for (let i = 1; i <= pkg.quantity; i++) {
        await db.insert(rooms).values({
          roomNumber: `${PACKAGE_PREFIX[pkg.id]}-${BRANCH_CODES[branch.id]}-${String(i).padStart(2, '0')}`,
          roomTypeId: inserted.id,
          branch: branch.id,
          status: 'available',
        });
      }
    }
    console.log(`Seeded ${pkg.quantity} treatment room(s) per branch for ${pkg.name}`);
  }
  process.exit(0);
}
seedCatalog();
