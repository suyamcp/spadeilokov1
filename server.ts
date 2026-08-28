import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { eq, and, or, lt, gt, sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { 
  bookings, guests, bookingRooms, rooms, adminSettings, payments, 
  adminSessions, siteContent, addOns, bookingAddOns, roomTypes
} from './src/db/schema.ts';
import { initializeApp as initAdmin, getApps as getAdminApps } from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

async function getRoomTypeBySlug(slug: string) {
  const [rt] = await db.select().from(roomTypes).where(eq(roomTypes.slug, slug)).limit(1);
  return rt;
}

async function getRoomTypeById(id: number) {
  const [rt] = await db.select().from(roomTypes).where(eq(roomTypes.id, id)).limit(1);
  return rt;
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const rows = await db.select().from(adminSessions)
      .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())))
      .limit(1);
    if (rows.length === 0) return res.status(401).json({ error: 'Session expired or invalid.' });
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ error: 'Internal auth verification error.' });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 image payloads for file uploads and capture rawBody for webhook signatures
  app.use(express.json({ 
    limit: '50mb',
    verify: (req: express.Request, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Load firebase configuration safely
  let firebaseConfig: any = null;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to read firebase config file in server.ts:', err);
  }

  // Initialize Firebase Admin if available
  if (firebaseConfig && firebaseConfig.projectId && getAdminApps().length === 0) {
    try {
      initAdmin({
        projectId: firebaseConfig.projectId,
      });
      console.log('Firebase Admin initialized for cloud storage operations.');
    } catch (err) {
      console.error('Failed to initialize Firebase Admin:', err);
    }
  }

  // Static serving for locally uploaded fallback assets
  const uploadDirDist = path.join(process.cwd(), 'dist', 'uploads');
  const uploadDirPublic = path.join(process.cwd(), 'public', 'uploads');
  try {
    if (!fs.existsSync(uploadDirDist)) fs.mkdirSync(uploadDirDist, { recursive: true });
    if (!fs.existsSync(uploadDirPublic)) fs.mkdirSync(uploadDirPublic, { recursive: true });
  } catch (err) {
    console.error('Failed to create local upload directory fallbacks:', err);
  }

  app.use('/uploads', express.static(uploadDirDist));
  app.use('/uploads', express.static(uploadDirPublic));

  // --- DATABASE SELF-HEALING SEEDING FOR ROOMS, ROOM TYPES, AND DEFAULT ADMIN ---
  async function seedRoomTypesAndRooms() {
    try {
      const existingTypes = await db.select().from(roomTypes).limit(1);
      if (existingTypes.length === 0) {
        console.log('No room types found in database. Seeding room types...');
        await db.insert(roomTypes).values([
          { id: 1, slug: 'luxury-cabin', name: 'Glass-Front Luxury Cabin', baseRate: '4999.00', capacity: 2 },
          { id: 2, slug: 'deluxe-glamping', name: 'Deluxe Glamping Suite Tent', baseRate: '3200.00', capacity: 4 },
          { id: 3, slug: 'standard-pitching', name: 'Premium Adventure Pitching Site', baseRate: '1200.00', capacity: 2 }
        ]);
        
        console.log('Seeding physical units (rooms)...');
        const roomsToInsert: any[] = [];
        // 4 Luxury Cabins
        for (let i = 1; i <= 4; i++) {
          roomsToInsert.push({ roomNumber: `LC-${String(i).padStart(2, '0')}`, roomTypeId: 1, status: 'available' });
        }
        // 8 Glamping Tents
        for (let i = 1; i <= 8; i++) {
          roomsToInsert.push({ roomNumber: `DG-${String(i).padStart(2, '0')}`, roomTypeId: 2, status: 'available' });
        }
        // 15 Pitching sites
        for (let i = 1; i <= 15; i++) {
          roomsToInsert.push({ roomNumber: `SP-${String(i).padStart(2, '0')}`, roomTypeId: 3, status: 'available' });
        }
        await db.insert(rooms).values(roomsToInsert);
        console.log('✓ Seeding room types and physical units completed successfully!');
      } else {
        console.log('Room types already exist. Skipping seed.');
      }
    } catch (err) {
      console.error('Failed to seed room types/rooms on startup:', err);
    }
  }

  async function seedDefaultAdminIfNeeded() {
    try {
      const hashRecord = await db.select().from(adminSettings).where(eq(adminSettings.key, 'admin_password_hash')).limit(1);
      if (hashRecord.length === 0) {
        console.log('No admin user found in database. Seeding default admin...');
        const hash = await bcrypt.hash('Fourniner11', 12);
        await db.insert(adminSettings).values([
          { key: 'admin_username', value: 'valleypoint2002@gmail.com' },
          { key: 'admin_password_hash', value: hash }
        ]);
        console.log('✓ Seeded default admin successfully!');
      }
    } catch (err) {
      console.error('Failed to seed default admin on startup:', err);
    }
  }

  await seedRoomTypesAndRooms();
  await seedDefaultAdminIfNeeded();

  // ==========================================
  // API ROUTES
  // ==========================================

  // Get all bookings from database (Admin Only)
  app.get('/api/bookings', requireAdmin, async (req, res) => {
    try {
      const dbBookings = await db.select({
        bookingId: bookings.id,
        reference: bookings.reference,
        status: bookings.status,
        specialRequests: bookings.specialRequests,
        bookingDate: bookings.bookingDate,
        guestId: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
        email: guests.email,
        phone: guests.phoneNumber,
        address: guests.address,
        roomId: rooms.id,
        roomNumber: rooms.roomNumber,
        roomTypeId: rooms.roomTypeId,
        roomTypeSlug: roomTypes.slug,
        roomTypeCapacity: roomTypes.capacity,
        checkInDate: bookingRooms.checkInDate,
        checkOutDate: bookingRooms.checkOutDate,
        actualPricePerNight: bookingRooms.actualPricePerNight,
        totalNights: bookingRooms.totalNights,
        totalCost: bookingRooms.totalCost,
      })
      .from(bookings)
      .innerJoin(guests, eq(bookings.guestId, guests.id))
      .innerJoin(bookingRooms, eq(bookingRooms.bookingId, bookings.id))
      .innerJoin(rooms, eq(bookingRooms.roomId, rooms.id))
      .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id));

      // Fetch booking add-ons
      const dbAddOns = await db.select({
        bookingId: bookingAddOns.bookingId,
        addOnId: addOns.id,
        name: addOns.name,
        quantity: bookingAddOns.quantity,
        actualPrice: bookingAddOns.actualPrice,
      })
      .from(bookingAddOns)
      .innerJoin(addOns, eq(bookingAddOns.addOnId, addOns.id));

      const addOnsMap: Record<number, any[]> = {};
      dbAddOns.forEach(ao => {
        if (!addOnsMap[ao.bookingId]) {
          addOnsMap[ao.bookingId] = [];
        }
        addOnsMap[ao.bookingId].push({
          id: String(ao.addOnId),
          name: ao.name,
          quantity: ao.quantity,
          price: Number(ao.actualPrice),
        });
      });

      const mapped = dbBookings.map(b => {
        const listAo = addOnsMap[b.bookingId] || [];
        const addOnsTotal = listAo.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const baseRoomTotal = b.totalCost ? Number(b.totalCost) : 0;
        return {
          id: String(b.bookingId),
          reference: b.reference,
          customerName: `${b.firstName} ${b.lastName}`.trim(),
          customerEmail: b.email,
          customerPhone: b.phone || '',
          checkIn: b.checkInDate,
          checkOut: b.checkOutDate,
          accommodationId: b.roomTypeSlug,
          guestsCount: b.roomTypeCapacity,
          totalAmount: baseRoomTotal + addOnsTotal,
          addOns: listAo,
          status: b.status as any,
          notes: b.specialRequests || undefined,
          createdAt: b.bookingDate ? b.bookingDate.toISOString() : new Date().toISOString(),
        };
      });

      res.json(mapped);
    } catch (error) {
      console.error('Failed to get bookings:', error);
      res.status(500).json({ error: 'Failed to retrieve bookings.' });
    }
  });

  // Public availability endpoint (No PII)
  app.get('/api/availability', async (req, res) => {
    try {
      const rows = await db.select({
        roomTypeSlug: roomTypes.slug, // NEW — join added
        roomId: bookingRooms.roomId,
        checkIn: bookingRooms.checkInDate,
        checkOut: bookingRooms.checkOutDate,
        status: bookings.status,
      })
      .from(bookingRooms)
      .innerJoin(bookings, eq(bookingRooms.bookingId, bookings.id))
      .innerJoin(rooms, eq(bookingRooms.roomId, rooms.id))
      .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)) // NEW
      .where(or(
        eq(bookings.status, 'confirmed'),
        eq(bookings.status, 'pending'),
        eq(bookings.status, 'paid_pending_review'),
      ));

      res.json(rows);
    } catch (error) {
      console.error('Failed to get availability:', error);
      res.status(500).json({ error: 'Failed to load availability.' });
    }
  });

  // Public CMS site content endpoint
  app.get('/api/content', async (req, res) => {
    try {
      const rows = await db.select().from(siteContent);
      const contentMap: Record<string, any> = {};
      rows.forEach(r => {
        try {
          contentMap[r.key] = JSON.parse(r.value);
        } catch (e) {
          contentMap[r.key] = r.value;
        }
      });
      res.json(contentMap);
    } catch (error) {
      console.error('Failed to get site content:', error);
      res.status(500).json({ error: 'Failed to retrieve site content.' });
    }
  });

  // Update CMS site content (Admin Only)
  app.post('/api/content', requireAdmin, async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required.' });
    }
    try {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      await db.insert(siteContent)
        .values({ key, value: valueStr, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: siteContent.key,
          set: { value: valueStr, updatedAt: new Date() }
        });
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to save site content:', error);
      res.status(500).json({ error: 'Failed to save site content.' });
    }
  });

  // Update booking status (Admin Only)
  app.patch('/api/bookings/:id/status', requireAdmin, async (req, res) => {
    const bookingId = Number(req.params.id);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status parameter is required.' });
    }
    try {
      await db.update(bookings)
        .set({ status, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to update booking status:', error);
      res.status(500).json({ error: 'Failed to update booking status.' });
    }
  });

  // Public add-ons catalog endpoint
  app.get('/api/add-ons', async (req, res) => {
    try {
      const rows = await db.select().from(addOns);
      res.json(rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
      })));
    } catch (error) {
      console.error('Failed to get add-ons catalog:', error);
      res.status(500).json({ error: 'Failed to load add-ons.' });
    }
  });

  // ==========================================
  // IMAGE GALLERY AND CLOUD STORAGE UPLOADS
  // ==========================================

  // Get all custom uploaded images stored in SQL settings index
  app.get('/api/uploaded-images', async (req, res) => {
    try {
      const record = await db.select().from(adminSettings).where(eq(adminSettings.key, 'custom_gallery_images')).limit(1);
      const images = record[0]?.value ? JSON.parse(record[0].value) : [];
      res.json(images);
    } catch (error) {
      console.error('Failed to get uploaded images:', error);
      res.json([]);
    }
  });

  // Upload base64 image (utilizes Firebase/Google Cloud Storage with robust local disk fallback) (Admin Only)
  app.post('/api/upload', requireAdmin, async (req, res) => {
    const { name, mimeType, base64 } = req.body;
    if (!name || !base64) {
      return res.status(400).json({ error: 'Missing name or base64 file data.' });
    }

    try {
      // Extract clean base64 string
      let cleanBase64 = base64;
      let detectedMime = mimeType || 'image/jpeg';
      if (base64.includes(';base64,')) {
        const parts = base64.split(';base64,');
        const mimePart = parts[0];
        cleanBase64 = parts[1];
        if (mimePart.startsWith('data:')) {
          detectedMime = mimePart.substring(5);
        }
      }

      const buffer = Buffer.from(cleanBase64, 'base64');
      let publicUrl = '';

      try {
        if (firebaseConfig && firebaseConfig.storageBucket) {
          const bucket = getAdminStorage().bucket(firebaseConfig.storageBucket);
          const cleanedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `uploads/${Date.now()}_${cleanedName}`;
          const file = bucket.file(fileName);

          await file.save(buffer, {
            metadata: { contentType: detectedMime },
            public: true,
          });

          // Attempt makePublic (might fail if Uniform Bucket Access is configured)
          try {
            await file.makePublic();
          } catch (e) {
            console.warn('makePublic failed, continuing (might use uniform bucket-level access):', e);
          }

          publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          console.log('Successfully uploaded image to cloud storage bucket:', publicUrl);
        } else {
          throw new Error('Firebase storageBucket configuration is not present.');
        }
      } catch (cloudError: any) {
        console.warn('Cloud Storage upload failed, executing local fallback saving:', cloudError);

        const uploadDirDist = path.join(process.cwd(), 'dist', 'uploads');
        const uploadDirPublic = path.join(process.cwd(), 'public', 'uploads');

        const cleanedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}_${cleanedName}`;

        fs.writeFileSync(path.join(uploadDirDist, fileName), buffer);
        fs.writeFileSync(path.join(uploadDirPublic, fileName), buffer);

        publicUrl = `/uploads/${fileName}`;
      }

      // Record successfully uploaded file in database settings
      const record = await db.select().from(adminSettings).where(eq(adminSettings.key, 'custom_gallery_images')).limit(1);
      const existingImages = record[0]?.value ? JSON.parse(record[0].value) : [];

      const newImg = { url: publicUrl, name: name };
      existingImages.push(newImg);

      await db.insert(adminSettings)
        .values({ key: 'custom_gallery_images', value: JSON.stringify(existingImages) })
        .onConflictDoUpdate({
          target: adminSettings.key,
          set: { value: JSON.stringify(existingImages) }
        });

      res.json({ success: true, url: publicUrl, name: name });
    } catch (error: any) {
      console.error('Image upload controller failed:', error);
      res.status(500).json({ error: error.message || 'An error occurred during file upload.' });
    }
  });

  // Create booking with real availability check, automated room assignment, server-side pricing, and transaction row locks
  app.post('/api/bookings', async (req, res) => {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      checkIn,
      checkOut,
      accommodationId,
      guestsCount,
      selectedAddOns = [], // array of { id: number, quantity: number }
      paymentMethod = 'cash', // 'cash' or 'paymongo'
      notes
    } = req.body;

    if (!customerName || !customerEmail || !checkIn || !checkOut || !accommodationId) {
      return res.status(400).json({ error: 'Missing required booking parameters.' });
    }

    try {
      const rtObj = await getRoomTypeBySlug(accommodationId);
      if (!rtObj) {
        return res.status(400).json({ error: 'Invalid accommodation selection.' });
      }
      const roomTypeId = rtObj.id;
      const reference = 'VP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Begin Transaction for atomic reservation & row-lock protection
      const result = await db.transaction(async (tx) => {
        // 1. Row lock rooms of this type to block concurrent transactions
        await tx.execute(sql`SELECT id FROM "rooms" WHERE "room_type_id" = ${roomTypeId} FOR UPDATE;`);

        // 2. Query available rooms of this type
        const roomsOfType = await tx.select().from(rooms).where(eq(rooms.roomTypeId, roomTypeId));

        // 3. Check overlaps
        const overlapping = await tx.select({
          roomId: bookingRooms.roomId,
        })
        .from(bookingRooms)
        .innerJoin(bookings, eq(bookingRooms.bookingId, bookings.id))
        .where(
          and(
            lt(bookingRooms.checkInDate, checkOut),
            gt(bookingRooms.checkOutDate, checkIn),
            or(
              eq(bookings.status, 'confirmed'),
              eq(bookings.status, 'pending'),
              eq(bookings.status, 'paid_pending_review')
            )
          )
        );

        const bookedIds = overlapping.map(o => o.roomId);
        const available = roomsOfType.filter(r => !bookedIds.includes(r.id));

        if (available.length === 0) {
          throw new Error('CONCURRENCY_CONFLICT');
        }

        const assignedRoom = available[0];

        // 4. Fetch the direct room rate from DB
        const rt = await tx.select().from(roomTypes).where(eq(roomTypes.id, roomTypeId)).limit(1);
        if (rt.length === 0) {
          throw new Error('INVALID_ROOM_TYPE');
        }
        const rate = Number(rt[0].baseRate);

        // 5. Calculate nights
        const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime());
        const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const roomCost = rate * totalNights;

        // 6. Compute Add-ons server-side
        let addOnsTotal = 0;
        const addOnsList: any[] = [];
        for (const reqAo of selectedAddOns) {
          const aoId = Number(reqAo.id);
          if (isNaN(aoId)) continue;
          const ao = await tx.select().from(addOns).where(eq(addOns.id, aoId)).limit(1);
          if (ao.length > 0) {
            const price = Number(ao[0].price);
            addOnsTotal += price * reqAo.quantity;
            addOnsList.push({
              id: ao[0].id,
              name: ao[0].name,
              quantity: reqAo.quantity,
              actualPrice: price,
            });
          }
        }

        const grandTotal = roomCost + addOnsTotal;

        // 7. Register or resolve guest
        const nameParts = customerName.trim().split(' ');
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || 'Surname';

        let guestRecord = await tx.select().from(guests).where(eq(guests.email, customerEmail)).limit(1);
        let guestId: number;

        if (guestRecord.length === 0) {
          const newGuest = await tx.insert(guests).values({
            firstName,
            lastName,
            email: customerEmail,
            phoneNumber: customerPhone || '',
            address: customerAddress || '',
          }).returning();
          guestId = newGuest[0].id;
        } else {
          guestId = guestRecord[0].id;
          // Optionally update guest info
          await tx.update(guests).set({
            phoneNumber: customerPhone || guestRecord[0].phoneNumber,
            address: customerAddress || guestRecord[0].address,
            updatedAt: new Date(),
          }).where(eq(guests.id, guestId));
        }

        // 8. Create booking
        const initialBookingStatus = (paymentMethod === 'paymongo') ? 'pending' : 'confirmed';
        const newBooking = await tx.insert(bookings).values({
          reference,
          guestId,
          status: initialBookingStatus,
          specialRequests: notes || '',
        }).returning();

        const bookingId = newBooking[0].id;

        // 9. Create booking-room connection
        await tx.insert(bookingRooms).values({
          bookingId,
          roomId: assignedRoom.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestCount: guestsCount || 1,
          actualPricePerNight: String(rate),
          totalNights,
          totalCost: String(roomCost),
        });

        // 10. Save Snapshot prices for Booking Add-ons
        for (const aoItem of addOnsList) {
          await tx.insert(bookingAddOns).values({
            bookingId,
            addOnId: aoItem.id,
            quantity: aoItem.quantity,
            actualPrice: String(aoItem.actualPrice),
          });
        }

        // 11. Create Payments record
        const initialPayStatus = (paymentMethod === 'paymongo') ? 'pending' : 'completed';
        await tx.insert(payments).values({
          bookingId,
          amount: String(grandTotal),
          currency: 'PHP',
          paymentMethod,
          paymentStatus: initialPayStatus,
        });

        return {
          bookingId,
          reference,
          grandTotal,
          roomName: rt[0].name,
          addOnsList,
          status: initialBookingStatus,
        };
      });

      // Transaction successfully committed! Let's handle PayMongo checkout now
      if (paymentMethod === 'paymongo') {
        const paymongoKey = process.env.PAYMONGO_SECRET_KEY;
        if (!paymongoKey) {
          return res.status(400).json({ 
            error: 'PayMongo secret key is missing. Please contact campsite administrator or choose CASH payment.' 
          });
        }

        const requestOrigin = req.headers.origin || req.headers.referer || 'http://localhost:3000';

        // Prepare line items in cents (e.g., PHP 10.00 is 1000 cents)
        const lineItems = [
          {
            name: `Campsite Accommodation: ${result.roomName}`,
            amount: Math.round(Number(result.grandTotal - result.addOnsList.reduce((sum, x) => sum + (x.actualPrice * x.quantity), 0)) * 100),
            currency: 'PHP',
            quantity: 1,
          }
        ];

        for (const ao of result.addOnsList) {
          lineItems.push({
            name: `Add-on: ${ao.name}`,
            amount: Math.round(ao.actualPrice * 100),
            currency: 'PHP',
            quantity: ao.quantity,
          });
        }

        try {
          const authString = Buffer.from(paymongoKey + ':').toString('base64');
          const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${authString}`,
            },
            body: JSON.stringify({
              data: {
                attributes: {
                  line_items: lineItems,
                  payment_method_types: ['card', 'gcash', 'paymaya'],
                  send_email_receipt: true,
                  metadata: {
                    booking_id: String(result.bookingId),
                    reference: result.reference,
                  },
                  success_url: `${requestOrigin}/booking-success?reference=${result.reference}`,
                  cancel_url: `${requestOrigin}/booking-cancel`,
                }
              }
            })
          });

          const data: any = await response.json();
          if (data.errors) {
            console.error('PayMongo Checkout Session creation failed with errors:', data.errors);
            throw new Error(data.errors[0]?.detail || 'PayMongo API error');
          }

          const checkoutUrl = data.data?.attributes?.checkout_url;
          if (!checkoutUrl) {
            throw new Error('Checkout URL not returned by PayMongo.');
          }

          return res.json({
            id: String(result.bookingId),
            reference: result.reference,
            checkoutUrl,
            isCash: false,
            totalAmount: result.grandTotal,
            status: result.status,
          });
        } catch (payError: any) {
          console.error('PayMongo execution failed:', payError);
          // Rollback booking by deleting it so the user can re-attempt (as we can't rollback the committed transaction)
          await db.delete(bookings).where(eq(bookings.id, result.bookingId));
          return res.status(500).json({ error: `Failed to create payment checkout session: ${payError.message}` });
        }
      }

      // Cash option committed successfully
      res.json({
        id: String(result.bookingId),
        reference: result.reference,
        isCash: true,
        totalAmount: result.grandTotal,
        status: result.status,
      });

    } catch (error: any) {
      if (error.message === 'CONCURRENCY_CONFLICT') {
        return res.status(409).json({ error: 'No available plots of this type for the selected dates.' });
      }
      if (error.message === 'INVALID_ROOM_TYPE') {
        return res.status(400).json({ error: 'Invalid accommodation selection.' });
      }
      console.error('Failed to create booking:', error);
      res.status(500).json({ error: 'An error occurred while saving your booking.' });
    }
  });

  // PayMongo Webhook listener (With signature verification, correct payload mapping, and review-pending workflow)
  app.post('/api/webhooks/paymongo', async (req: express.Request, res: express.Response) => {
    try {
      const signatureHeader = req.headers['paymongo-signature'] as string | undefined;
      if (!signatureHeader || !req.rawBody) {
        return res.status(400).json({ error: 'Missing signature or body.' });
      }

      const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=')));
      const { t, te, li } = parts;
      const signatureToCompare = te || li;

      const signedPayload = `${t}.${req.rawBody.toString('utf8')}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET || '')
        .update(signedPayload)
        .digest('hex');

      if (expectedSignature !== signatureToCompare) {
        console.warn('PayMongo webhook signature mismatch — discarding.');
        return res.status(400).json({ error: 'Invalid signature.' });
      }

      const payload = req.body;
      const eventType = payload?.data?.attributes?.type;

      if (eventType === 'checkout_session.payment.paid') {
        const session = payload?.data?.attributes?.data; // CHANGED — was `.resource`, PayMongo actually nests it under `.data`
        const bookingIdStr = session?.attributes?.metadata?.booking_id;
        const paymentsList = session?.attributes?.payments || [];
        const transactionId = paymentsList[0]?.id || null;

        if (!bookingIdStr) {
          console.error('PayMongo webhook: no booking_id in metadata, payload was:', JSON.stringify(payload));
          return res.status(200).json({ received: true }); // acknowledge anyway, it's not PayMongo's fault
        }

        const bookingId = Number(bookingIdStr);
        await db.update(bookings)
          .set({ status: 'paid_pending_review', updatedAt: new Date() }) // CHANGED — was 'confirmed'; a human needs to review this, not skip straight past
          .where(eq(bookings.id, bookingId));
        await db.update(payments)
          .set({ paymentStatus: 'completed', transactionId, updatedAt: new Date() })
          .where(eq(payments.bookingId, bookingId));
      }

      res.status(200).json({ received: true });
    } catch (webhookError) {
      console.error('PayMongo webhook handler failed:', webhookError);
      res.status(500).json({ error: 'Webhook processing failed.' });
    }
  });

  // Cancel booking (Accessible by Admin OR Customer with valid Reference code)
  app.post('/api/bookings/:id/cancel', async (req, res) => {
    const bookingId = Number(req.params.id);
    const { reference } = req.body;
    
    try {
      let isAuthorized = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const validSession = await db.select().from(adminSessions)
          .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())))
          .limit(1);
        if (validSession.length > 0) {
          isAuthorized = true;
        }
      }
      
      if (!isAuthorized) {
        if (!reference) {
          return res.status(401).json({ error: 'Unauthorized. Reference code is required for customer cancellation.' });
        }
        const b = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
        if (b.length === 0 || b[0].reference !== reference) {
          return res.status(403).json({ error: 'Forbidden. Invalid reference code.' });
        }
        isAuthorized = true;
      }
      
      await db.update(bookings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
        
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      res.status(500).json({ error: 'Failed to cancel booking.' });
    }
  });

  // Reject/Delete booking record (Admin Only) - Soft-delete via status change
  app.delete('/api/bookings/:id', requireAdmin, async (req, res) => {
    const bookingId = Number(req.params.id);
    try {
      await db.update(bookings)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete/reject booking:', error);
      res.status(500).json({ error: 'Failed to delete/reject booking.' });
    }
  });

  // Admin Verification Login Endpoint (Secure with hashed passwords and sessions)
  app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
      const userRecord = await db.select().from(adminSettings).where(eq(adminSettings.key, 'admin_username')).limit(1);
      const hashRecord = await db.select().from(adminSettings).where(eq(adminSettings.key, 'admin_password_hash')).limit(1);

      const dbUser = userRecord[0]?.value;
      const dbHash = hashRecord[0]?.value;

      if (!dbUser || !dbHash) {
        return res.status(401).json({ error: 'Admin credentials not configured.' });
      }

      if (username === dbUser && await bcrypt.compare(password, dbHash)) {
        const token = crypto.randomBytes(32).toString('hex');
        await db.insert(adminSessions).values({ token, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) });
        return res.json({ success: true, token });
      } else {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // Change Admin Password Settings (Secure with requireAdmin & bcrypt)
  app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    try {
      const hash = await bcrypt.hash(newPassword, 12);
      await db.insert(adminSettings)
        .values({ key: 'admin_password_hash', value: hash })
        .onConflictDoUpdate({
          target: adminSettings.key,
          set: { value: hash },
        });

      // Clear all sessions to force re-authentication
      await db.delete(adminSessions);

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to change admin password:', error);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  // ==========================================
  // VITE DEVELOPMENT MIDDLEWARE OR STATIC PROD
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
