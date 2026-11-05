import type { Config } from "@netlify/functions";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { ensureSeeded } from "../../db/seed.js";
import {
  appSettings, bookings, categories, professionals, reviews, services, users,
  type StatusChange,
} from "../../db/schema.js";

// HomeEase REST API (formerly the Express server in homeease/backend), running as a
// Netlify Function on /api/* and persisting data in Netlify Database.

type UserRow = typeof users.$inferSelect;
type ServiceRow = typeof services.$inferSelect;
type ProRow = typeof professionals.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;

type Ctx = {
  req: Request;
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
  user?: UserRow;
};
type Handler = (ctx: Ctx) => Promise<Response> | Response;
type Guard = "auth" | "admin" | "pro";

// ─── Helpers ────────────────────────────────────────────────
const json = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (status: number, message: string) => json({ success: false, message }, status);

const newId = () => `id_${randomUUID()}`;
const newBookingCode = () => {
  const t = Date.now().toString(36).toUpperCase();
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `HE-${t}-${r}`;
};

const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const paging = (q: URLSearchParams, defaultLimit: number) => {
  const page = Math.max(1, Math.floor(num(q.get("page"), 1)));
  const limit = Math.min(100, Math.max(1, Math.floor(num(q.get("limit"), defaultLimit))));
  return { page, limit, offset: (page - 1) * limit };
};

const withId = <T extends { id: string }>(row: T) => {
  const { id, ...rest } = row;
  return { _id: id, ...rest };
};

const safeUser = (u?: Partial<UserRow> | null) =>
  u
    ? {
        _id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
        profileImage: u.profileImage, addresses: u.addresses, isActive: u.isActive, createdAt: u.createdAt,
      }
    : {};

const isUniqueViolation = (err: any) => err?.code === "23505" || err?.cause?.code === "23505";

const countOf = async (table: any, where?: SQL) => {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table).where(where);
  return row?.n ?? 0;
};

// Pick only known, allowed fields from a request body.
const pick = <K extends string>(body: any, keys: readonly K[]) => {
  const out: Partial<Record<K, any>> = {};
  for (const k of keys) if (body?.[k] !== undefined) out[k] = body[k];
  return out;
};

// ─── Population (mirrors the old in-memory "populate" helpers) ───
const categoryMap = async () => {
  const rows = await db.select().from(categories);
  return new Map<string, CategoryRow>(rows.map((c) => [c.id, c]));
};

const populateServices = async (rows: ServiceRow[]) => {
  const cats = await categoryMap();
  return rows.map((s) => {
    const c = cats.get(s.category);
    return { ...withId(s), category: c ? withId(c) : s.category };
  });
};

const usersById = async (ids: string[]) => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map<string, UserRow>();
  const rows = await db.select().from(users).where(inArray(users.id, unique));
  return new Map(rows.map((u) => [u.id, u]));
};

const populatePros = async (rows: ProRow[]) => {
  const [cats, us] = await Promise.all([categoryMap(), usersById(rows.map((p) => p.userId))]);
  return rows.map((p) => ({
    ...withId(p),
    userId: safeUser(us.get(p.userId)),
    serviceCategories: p.serviceCategories.map((id) => {
      const c = cats.get(id);
      return c ? withId(c) : { _id: id };
    }),
  }));
};

const findOne = async <T>(promise: Promise<T[]>) => (await promise)[0];

// ─── JWT ────────────────────────────────────────────────────
let secretPromise: Promise<string> | null = null;
const getSecret = () => {
  // Prefer an explicitly configured secret; otherwise generate one once and keep it in the database.
  secretPromise ??= (async () => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    await db
      .insert(appSettings)
      .values({ key: "jwt_secret", value: randomBytes(48).toString("hex") })
      .onConflictDoNothing();
    const row = await findOne(db.select().from(appSettings).where(eq(appSettings.key, "jwt_secret")));
    return row!.value;
  })().catch((err) => {
    secretPromise = null;
    throw err;
  });
  return secretPromise;
};
const genToken = async (id: string) => jwt.sign({ id }, await getSecret(), { expiresIn: "7d" });

const authenticate = async (req: Request): Promise<UserRow | Response> => {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return fail(401, "Not authorized");
  let decoded: any;
  try {
    decoded = jwt.verify(header.slice(7), await getSecret());
  } catch {
    return fail(401, "Invalid token");
  }
  const user = await findOne(db.select().from(users).where(eq(users.id, String(decoded?.id))));
  if (!user || !user.isActive) return fail(401, "User not found");
  return user;
};

// ─── Router ─────────────────────────────────────────────────
const routes: { method: string; pattern: RegExp; keys: string[]; guard?: Guard; handler: Handler }[] = [];
const route = (method: string, path: string, guardOrHandler: Guard | Handler, maybeHandler?: Handler) => {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" + path.replace(/:([A-Za-z]+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$",
  );
  const guard = typeof guardOrHandler === "string" ? guardOrHandler : undefined;
  const handler = (typeof guardOrHandler === "function" ? guardOrHandler : maybeHandler)!;
  routes.push({ method, pattern, keys, guard, handler });
};

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════

route("POST", "/auth/register", async ({ body }) => {
  const { name, email, phone, password, role } = body;
  if (!name || !email || !password) return fail(400, "Name, email and password are required");
  const normalized = String(email).toLowerCase().trim();
  const userRole = ["customer", "professional"].includes(role) ? role : "customer";

  try {
    const [user] = await db
      .insert(users)
      .values({
        id: newId(), name, email: normalized, phone: phone || "",
        password: await bcrypt.hash(String(password), 10), role: userRole,
      })
      .returning();
    return json(
      { success: true, message: "Registration successful", token: await genToken(user.id), user: safeUser(user) },
      201,
    );
  } catch (err) {
    if (isUniqueViolation(err)) return fail(400, "Email already registered");
    throw err;
  }
});

route("POST", "/auth/login", async ({ body }) => {
  const { email, password } = body;
  if (!email || !password) return fail(400, "Email and password required");
  const user = await findOne(db.select().from(users).where(eq(users.email, String(email).toLowerCase().trim())));
  if (!user || !(await bcrypt.compare(String(password), user.password))) return fail(401, "Invalid email or password");
  if (!user.isActive) return fail(403, "Account deactivated");
  return json({ success: true, message: "Login successful", token: await genToken(user.id), user: safeUser(user) });
});

route("GET", "/auth/me", "auth", async ({ user }) => {
  let professionalProfile = null;
  if (user!.role === "professional") {
    const pro = await findOne(db.select().from(professionals).where(eq(professionals.userId, user!.id)));
    professionalProfile = pro ? (await populatePros([pro]))[0] : {};
  }
  return json({ success: true, user: safeUser(user), professionalProfile });
});

route("PUT", "/auth/profile", "auth", async ({ user, body }) => {
  const updates: Partial<UserRow> = {};
  if (body.name) updates.name = body.name;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.profileImage !== undefined) updates.profileImage = body.profileImage;
  const [updated] = Object.keys(updates).length
    ? await db.update(users).set(updates).where(eq(users.id, user!.id)).returning()
    : [user!];
  return json({ success: true, message: "Profile updated", user: safeUser(updated) });
});

route("PUT", "/auth/change-password", "auth", async ({ user, body }) => {
  const { currentPassword, newPassword } = body;
  if (!newPassword) return fail(400, "New password is required");
  if (!(await bcrypt.compare(String(currentPassword ?? ""), user!.password)))
    return fail(400, "Current password is incorrect");
  await db.update(users).set({ password: await bcrypt.hash(String(newPassword), 10) }).where(eq(users.id, user!.id));
  return json({ success: true, message: "Password changed successfully" });
});

route("POST", "/auth/address", "auth", async ({ user, body }) => {
  const { label, street, city, state, zipCode, isDefault } = body;
  const addresses = (isDefault ? user!.addresses.map((a) => ({ ...a, isDefault: false })) : [...user!.addresses]);
  addresses.push({ _id: newId(), label: label || "Home", street, city, state, zipCode: zipCode || "", isDefault: !!isDefault });
  await db.update(users).set({ addresses }).where(eq(users.id, user!.id));
  return json({ success: true, message: "Address added", addresses });
});

route("DELETE", "/auth/address/:addressId", "auth", async ({ user, params }) => {
  const addresses = user!.addresses.filter((a) => a._id !== params.addressId);
  await db.update(users).set({ addresses }).where(eq(users.id, user!.id));
  return json({ success: true, message: "Address removed", addresses });
});

// ══════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════

const CATEGORY_FIELDS = ["categoryName", "icon", "description", "image", "isActive", "sortOrder"] as const;

route("GET", "/categories", async () => {
  const rows = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  return json({ success: true, categories: rows.map(withId) });
});

route("POST", "/categories", "admin", async ({ body }) => {
  if (!body.categoryName) return fail(400, "Category name is required");
  const values = pick(body, CATEGORY_FIELDS);
  if (values.sortOrder !== undefined) values.sortOrder = num(values.sortOrder, 0);
  const [cat] = await db
    .insert(categories)
    .values({ ...values, id: newId(), categoryName: body.categoryName, isActive: true })
    .returning();
  return json({ success: true, category: withId(cat) }, 201);
});

route("PUT", "/categories/:id", "admin", async ({ params, body }) => {
  const updates = pick(body, CATEGORY_FIELDS);
  if (updates.sortOrder !== undefined) updates.sortOrder = num(updates.sortOrder, 0);
  const [cat] = Object.keys(updates).length
    ? await db.update(categories).set(updates).where(eq(categories.id, params.id)).returning()
    : await db.select().from(categories).where(eq(categories.id, params.id));
  if (!cat) return fail(404, "Category not found");
  return json({ success: true, category: withId(cat) });
});

route("DELETE", "/categories/:id", "admin", async ({ params }) => {
  const deleted = await db.delete(categories).where(eq(categories.id, params.id)).returning({ id: categories.id });
  if (!deleted.length) return fail(404, "Not found");
  return json({ success: true, message: "Category deleted" });
});

// ══════════════════════════════════════════════════════════════
//  SERVICES
// ══════════════════════════════════════════════════════════════

const SERVICE_FIELDS = [
  "serviceName", "category", "description", "shortDescription", "price", "priceType",
  "duration", "features", "image", "isActive", "isFeatured",
] as const;
const normalizeService = (values: Partial<Record<(typeof SERVICE_FIELDS)[number], any>>) => {
  if (values.price !== undefined) values.price = num(values.price, 0);
  if (values.duration !== undefined) values.duration = Math.round(num(values.duration, 60));
  if (values.isFeatured !== undefined) values.isFeatured = values.isFeatured === true || values.isFeatured === "true";
  if (values.features !== undefined && !Array.isArray(values.features)) values.features = [];
  return values;
};

route("GET", "/services/featured", async () => {
  const rows = await db.select().from(services).where(and(eq(services.isActive, true), eq(services.isFeatured, true)));
  return json({ success: true, services: await populateServices(rows) });
});

route("GET", "/services", async ({ query }) => {
  const conds: SQL[] = [eq(services.isActive, true)];
  const search = query.get("search");
  if (search) {
    const q = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    conds.push(or(ilike(services.serviceName, q), ilike(services.description, q))!);
  }
  if (query.get("category")) conds.push(eq(services.category, query.get("category")!));
  if (query.get("minPrice")) conds.push(gte(services.price, num(query.get("minPrice"), 0)));
  if (query.get("maxPrice")) conds.push(lte(services.price, num(query.get("maxPrice"), Number.MAX_SAFE_INTEGER)));
  if (query.get("minRating")) conds.push(gte(services.avgRating, num(query.get("minRating"), 0)));
  const where = and(...conds);

  const order = {
    price_asc: [asc(services.price)],
    price_desc: [desc(services.price)],
    rating: [desc(services.avgRating)],
    popular: [desc(services.totalBookings)],
  }[query.get("sort") ?? ""] ?? [asc(services.createdAt), asc(services.id)];

  const { page, limit, offset } = paging(query, 12);
  const [total, rows] = await Promise.all([
    countOf(services, where),
    db.select().from(services).where(where).orderBy(...order).limit(limit).offset(offset),
  ]);
  return json({
    success: true, services: await populateServices(rows), total,
    totalPages: Math.ceil(total / limit), currentPage: page,
  });
});

route("GET", "/services/:id", async ({ params }) => {
  const s = await findOne(db.select().from(services).where(eq(services.id, params.id)));
  if (!s) return fail(404, "Service not found");
  return json({ success: true, service: (await populateServices([s]))[0] });
});

route("POST", "/services", "admin", async ({ body }) => {
  const values = normalizeService(pick(body, SERVICE_FIELDS));
  if (!values.serviceName || !values.category) return fail(400, "Service name and category are required");
  const [svc] = await db
    .insert(services)
    .values({ ...values, id: newId(), serviceName: values.serviceName, category: values.category, isActive: true })
    .returning();
  return json({ success: true, service: (await populateServices([svc]))[0] }, 201);
});

route("PUT", "/services/:id", "admin", async ({ params, body }) => {
  const updates = normalizeService(pick(body, SERVICE_FIELDS));
  const [svc] = Object.keys(updates).length
    ? await db.update(services).set(updates).where(eq(services.id, params.id)).returning()
    : await db.select().from(services).where(eq(services.id, params.id));
  if (!svc) return fail(404, "Service not found");
  return json({ success: true, service: (await populateServices([svc]))[0] });
});

route("DELETE", "/services/:id", "admin", async ({ params }) => {
  const deleted = await db.delete(services).where(eq(services.id, params.id)).returning({ id: services.id });
  if (!deleted.length) return fail(404, "Not found");
  return json({ success: true, message: "Service deleted" });
});

// ══════════════════════════════════════════════════════════════
//  PROFESSIONALS
// ══════════════════════════════════════════════════════════════

const servesCategory = (categoryId: string) =>
  sql`${professionals.serviceCategories} @> ${JSON.stringify([categoryId])}::jsonb`;

route("GET", "/professionals", async ({ query }) => {
  const conds: SQL[] = [eq(professionals.isActive, true), eq(professionals.verificationStatus, "verified")];
  if (query.get("category")) conds.push(servesCategory(query.get("category")!));
  if (query.get("minRating")) conds.push(gte(professionals.rating, num(query.get("minRating"), 0)));
  const where = and(...conds);

  const sort = query.get("sort");
  const order =
    sort === "jobs" ? desc(professionals.completedJobs)
    : sort === "experience" ? desc(professionals.experience)
    : desc(professionals.rating);

  const { page, limit, offset } = paging(query, 12);
  const [total, rows] = await Promise.all([
    countOf(professionals, where),
    db.select().from(professionals).where(where).orderBy(order, asc(professionals.id)).limit(limit).offset(offset),
  ]);
  return json({
    success: true, professionals: await populatePros(rows), total,
    totalPages: Math.ceil(total / limit), currentPage: page,
  });
});

route("GET", "/professionals/my-profile", "pro", async ({ user }) => {
  const pro = await findOne(db.select().from(professionals).where(eq(professionals.userId, user!.id)));
  if (!pro) return fail(404, "Professional profile not found");
  return json({ success: true, professional: (await populatePros([pro]))[0] });
});

route("GET", "/professionals/by-service/:serviceId", async ({ params }) => {
  const svc = await findOne(db.select().from(services).where(eq(services.id, params.serviceId)));
  if (!svc) return fail(404, "Service not found");
  const rows = await db
    .select()
    .from(professionals)
    .where(and(
      eq(professionals.isActive, true),
      eq(professionals.verificationStatus, "verified"),
      servesCategory(svc.category),
    ));
  return json({ success: true, professionals: await populatePros(rows) });
});

route("GET", "/professionals/:id", async ({ params }) => {
  const pro = await findOne(db.select().from(professionals).where(eq(professionals.id, params.id)));
  if (!pro) return fail(404, "Professional not found");
  return json({ success: true, professional: (await populatePros([pro]))[0] });
});

route("PUT", "/professionals/profile", "pro", async ({ user, body }) => {
  const updates = pick(body, ["experience", "description", "skills", "hourlyRate", "location", "serviceCategories"] as const);
  if (updates.experience !== undefined) updates.experience = Math.round(num(updates.experience, 0));
  if (updates.hourlyRate !== undefined) updates.hourlyRate = num(updates.hourlyRate, 0);
  if (updates.skills !== undefined && !Array.isArray(updates.skills)) updates.skills = [];
  if (updates.serviceCategories !== undefined && !Array.isArray(updates.serviceCategories)) updates.serviceCategories = [];

  let pro = await findOne(db.select().from(professionals).where(eq(professionals.userId, user!.id)));
  if (!pro) {
    [pro] = await db.insert(professionals).values({ ...updates, id: newId(), userId: user!.id }).returning();
  } else if (Object.keys(updates).length) {
    [pro] = await db.update(professionals).set(updates).where(eq(professionals.id, pro.id)).returning();
  }
  return json({ success: true, professional: (await populatePros([pro]))[0] });
});

route("PUT", "/professionals/availability", "pro", async ({ user, body }) => {
  const updates: Partial<ProRow> = {};
  if (Array.isArray(body.availability)) updates.availability = body.availability;
  if (body.isAvailableToday !== undefined) updates.isAvailableToday = !!body.isAvailableToday;
  const [pro] = Object.keys(updates).length
    ? await db.update(professionals).set(updates).where(eq(professionals.userId, user!.id)).returning()
    : await db.select().from(professionals).where(eq(professionals.userId, user!.id));
  if (!pro) return fail(404, "Profile not found");
  return json({ success: true, professional: (await populatePros([pro]))[0] });
});

// ══════════════════════════════════════════════════════════════
//  BOOKINGS
// ══════════════════════════════════════════════════════════════

const ALL_SLOTS = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"];
const BOOKING_STATUSES = ["pending", "confirmed", "professional_assigned", "in_progress", "completed", "cancelled"];
const dayOf = (date: string) => String(date).split("T")[0];

const appendHistory = (entry: StatusChange) =>
  sql`${bookings.statusHistory} || ${JSON.stringify([entry])}::jsonb`;

route("GET", "/bookings/available-slots", async ({ query }) => {
  const professionalId = query.get("professionalId");
  const date = query.get("date");
  if (!professionalId || !date) return json({ success: true, availableSlots: ALL_SLOTS, bookedSlots: [] });

  const rows = await db
    .select({ timeSlot: bookings.timeSlot })
    .from(bookings)
    .where(and(
      eq(bookings.professionalId, professionalId),
      eq(bookings.appointmentDate, dayOf(date)),
      ne(bookings.bookingStatus, "cancelled"),
    ));
  const booked = rows.map((r) => r.timeSlot);
  return json({ success: true, availableSlots: ALL_SLOTS.filter((s) => !booked.includes(s)), bookedSlots: booked });
});

route("POST", "/bookings", "auth", async ({ user, body }) => {
  if (user!.role !== "customer") return fail(403, "Only customers can book");
  const { serviceId, professionalId, appointmentDate, timeSlot, address, instructions, paymentMethod } = body;
  if (!appointmentDate || !timeSlot) return fail(400, "Appointment date and time slot are required");

  const [svc, pro] = await Promise.all([
    findOne(db.select().from(services).where(eq(services.id, String(serviceId)))),
    findOne(db.select().from(professionals).where(eq(professionals.id, String(professionalId)))),
  ]);
  if (!svc) return fail(404, "Service not found");
  if (!pro) return fail(404, "Professional not found");
  if (new Date(appointmentDate) < new Date()) return fail(400, "Cannot book in the past");

  let booking;
  try {
    [booking] = await db
      .insert(bookings)
      .values({
        id: newId(),
        bookingId: newBookingCode(),
        customerId: user!.id,
        professionalId: pro.id,
        serviceId: svc.id,
        appointmentDate: dayOf(appointmentDate),
        timeSlot,
        address,
        instructions: instructions || "",
        servicePrice: svc.price,
        totalAmount: svc.price,
        paymentMethod: paymentMethod || "demo",
        statusHistory: [{ status: "pending", changedAt: new Date().toISOString(), changedBy: user!.name, note: "Booking created" }],
      })
      .returning();
  } catch (err) {
    if (isUniqueViolation(err)) return fail(400, "This time slot is already booked");
    throw err;
  }
  const [updatedSvc] = await db
    .update(services)
    .set({ totalBookings: sql`${services.totalBookings} + 1` })
    .where(eq(services.id, svc.id))
    .returning();

  const [[populatedSvc], [populatedPro]] = await Promise.all([populateServices([updatedSvc]), populatePros([pro])]);
  return json({
    success: true, message: "Booking created successfully",
    booking: { ...withId(booking), serviceId: populatedSvc, professionalId: populatedPro, customerId: safeUser(user) },
  }, 201);
});

const bookingStatusFilter = (query: URLSearchParams) => {
  const status = query.get("status");
  return status ? eq(bookings.bookingStatus, status) : undefined;
};

route("GET", "/bookings/my-bookings", "auth", async ({ user, query }) => {
  const where = and(eq(bookings.customerId, user!.id), bookingStatusFilter(query));
  const { page, limit, offset } = paging(query, 10);
  const [total, rows] = await Promise.all([
    countOf(bookings, where),
    db.select().from(bookings).where(where).orderBy(desc(bookings.createdAt)).limit(limit).offset(offset),
  ]);

  const [svcRows, proRows] = await Promise.all([
    rows.length ? db.select().from(services).where(inArray(services.id, rows.map((b) => b.serviceId))) : [],
    rows.length ? db.select().from(professionals).where(inArray(professionals.id, rows.map((b) => b.professionalId))) : [],
  ]);
  const [svcs, pros] = await Promise.all([populateServices(svcRows), populatePros(proRows)]);
  const svcMap = new Map(svcs.map((s) => [s._id, s]));
  const proMap = new Map(pros.map((p) => [p._id, p]));

  return json({
    success: true,
    bookings: rows.map((b) => ({
      ...withId(b),
      serviceId: svcMap.get(b.serviceId) ?? { _id: b.serviceId, serviceName: "Service" },
      professionalId: proMap.get(b.professionalId) ?? { _id: b.professionalId, userId: {}, serviceCategories: [] },
    })),
    total, totalPages: Math.ceil(total / limit), currentPage: page,
  });
});

route("GET", "/bookings/professional-bookings", "pro", async ({ user, query }) => {
  const pro = await findOne(db.select().from(professionals).where(eq(professionals.userId, user!.id)));
  if (!pro) return fail(404, "Professional profile not found");

  const where = and(eq(bookings.professionalId, pro.id), bookingStatusFilter(query));
  const { page, limit, offset } = paging(query, 10);
  const [total, rows] = await Promise.all([
    countOf(bookings, where),
    db.select().from(bookings).where(where).orderBy(desc(bookings.createdAt)).limit(limit).offset(offset),
  ]);

  const [svcRows, customers] = await Promise.all([
    rows.length ? db.select().from(services).where(inArray(services.id, rows.map((b) => b.serviceId))) : [],
    usersById(rows.map((b) => b.customerId)),
  ]);
  const svcMap = new Map((await populateServices(svcRows)).map((s) => [s._id, s]));

  return json({
    success: true,
    bookings: rows.map((b) => ({
      ...withId(b),
      serviceId: svcMap.get(b.serviceId) ?? { _id: b.serviceId, serviceName: "Service" },
      customerId: customers.has(b.customerId) ? safeUser(customers.get(b.customerId)) : { _id: b.customerId, name: "Customer" },
    })),
    total, totalPages: Math.ceil(total / limit), currentPage: page,
  });
});

route("GET", "/bookings/:id", "auth", async ({ user, params }) => {
  const b = await findOne(db.select().from(bookings).where(eq(bookings.id, params.id)));
  if (!b) return fail(404, "Booking not found");
  const pro = await findOne(db.select().from(professionals).where(eq(professionals.id, b.professionalId)));
  const isCustomer = b.customerId === user!.id;
  const isPro = pro?.userId === user!.id;
  if (!isCustomer && !isPro && user!.role !== "admin") return fail(403, "Access denied");

  const [svcRows, customers] = await Promise.all([
    db.select().from(services).where(eq(services.id, b.serviceId)),
    usersById([b.customerId]),
  ]);
  return json({
    success: true,
    booking: {
      ...withId(b),
      serviceId: (await populateServices(svcRows))[0] ?? {},
      professionalId: pro ? (await populatePros([pro]))[0] : b.professionalId,
      customerId: safeUser(customers.get(b.customerId)),
    },
  });
});

route("PUT", "/bookings/:id/status", "pro", async ({ user, params, body }) => {
  const { status, note } = body;
  if (!BOOKING_STATUSES.includes(status)) return fail(400, "Invalid status");

  const b = await findOne(db.select().from(bookings).where(eq(bookings.id, params.id)));
  if (!b) return fail(404, "Booking not found");
  const pro = await findOne(db.select().from(professionals).where(eq(professionals.id, b.professionalId)));
  if (pro?.userId !== user!.id) return fail(403, "Access denied");

  const becameCompleted = status === "completed" && b.bookingStatus !== "completed";
  const [updated] = await db
    .update(bookings)
    .set({
      bookingStatus: status,
      ...(becameCompleted ? { completedAt: new Date() } : {}),
      statusHistory: appendHistory({ status, changedAt: new Date().toISOString(), changedBy: user!.name, note: note || "" }),
    })
    .where(eq(bookings.id, b.id))
    .returning();
  if (becameCompleted) {
    await db
      .update(professionals)
      .set({ completedJobs: sql`${professionals.completedJobs} + 1` })
      .where(eq(professionals.id, b.professionalId));
  }
  return json({ success: true, message: `Status updated to ${status}`, booking: withId(updated) });
});

route("PUT", "/bookings/:id/cancel", "auth", async ({ user, params, body }) => {
  const b = await findOne(db.select().from(bookings).where(eq(bookings.id, params.id)));
  if (!b) return fail(404, "Booking not found");
  if (b.customerId !== user!.id && user!.role !== "admin") return fail(403, "Access denied");
  if (!["pending", "confirmed"].includes(b.bookingStatus))
    return fail(400, `Cannot cancel a ${b.bookingStatus} booking`);

  const reason = body.reason || "";
  const [updated] = await db
    .update(bookings)
    .set({
      bookingStatus: "cancelled",
      cancellationReason: reason || "Cancelled by customer",
      cancelledBy: user!.role === "admin" ? "admin" : "customer",
      statusHistory: appendHistory({ status: "cancelled", changedAt: new Date().toISOString(), changedBy: user!.name, note: reason }),
    })
    .where(eq(bookings.id, b.id))
    .returning();
  return json({ success: true, message: "Booking cancelled", booking: withId(updated) });
});

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════

route("POST", "/reviews", "auth", async ({ user, body }) => {
  const { bookingId, comment } = body;
  const rating = Math.round(num(body.rating, 0));
  if (rating < 1 || rating > 5) return fail(400, "Rating must be between 1 and 5");

  const booking = await findOne(db.select().from(bookings).where(eq(bookings.id, String(bookingId))));
  if (!booking) return fail(404, "Booking not found");
  if (booking.customerId !== user!.id) return fail(403, "Not your booking");
  if (booking.bookingStatus !== "completed") return fail(400, "Can only review completed bookings");

  // Atomically claim the review slot so concurrent submissions can't create duplicates.
  const claimed = await db
    .update(bookings)
    .set({ hasReview: true })
    .where(and(eq(bookings.id, booking.id), eq(bookings.hasReview, false)))
    .returning({ id: bookings.id });
  if (!claimed.length) return fail(400, "Already reviewed");

  const [review] = await db
    .insert(reviews)
    .values({
      id: newId(), customerId: user!.id, professionalId: booking.professionalId,
      bookingId: booking.id, serviceId: booking.serviceId, rating, comment: comment || "",
    })
    .returning();

  // Recalculate the professional's rating from all of their reviews.
  const [agg] = await db
    .select({ avg: sql<number>`avg(${reviews.rating})::float`, n: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.professionalId, booking.professionalId));
  await db
    .update(professionals)
    .set({ rating: Math.round((agg?.avg ?? 0) * 10) / 10, totalReviews: agg?.n ?? 0 })
    .where(eq(professionals.id, booking.professionalId));

  return json({ success: true, message: "Review submitted", review: { ...withId(review), customerId: safeUser(user) } }, 201);
});

route("GET", "/reviews/:professionalId", async ({ params, query }) => {
  const where = and(eq(reviews.professionalId, params.professionalId), eq(reviews.isVisible, true));
  const { limit, offset } = paging(query, 10);
  const [total, rows] = await Promise.all([
    countOf(reviews, where),
    db.select().from(reviews).where(where).orderBy(desc(reviews.createdAt)).limit(limit).offset(offset),
  ]);
  const customers = await usersById(rows.map((r) => r.customerId));
  return json({
    success: true,
    reviews: rows.map((r) => ({
      ...withId(r),
      customerId: customers.has(r.customerId) ? safeUser(customers.get(r.customerId)) : { name: "Customer" },
    })),
    total, totalPages: Math.ceil(total / limit),
  });
});

// ══════════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════════

const withCustomerAndService = async (rows: (typeof bookings.$inferSelect)[]) => {
  const [customers, svcRows] = await Promise.all([
    usersById(rows.map((b) => b.customerId)),
    rows.length ? db.select().from(services).where(inArray(services.id, rows.map((b) => b.serviceId))) : [],
  ]);
  const svcMap = new Map(svcRows.map((s) => [s.id, withId(s)]));
  return rows.map((b) => ({
    ...withId(b),
    customerId: safeUser(customers.get(b.customerId)),
    serviceId: svcMap.get(b.serviceId) ?? {},
  }));
};

route("GET", "/admin/dashboard", "admin", async () => {
  const [statusCounts, [revenue], userCounts, totalServices, totalCategories, recent] = await Promise.all([
    db.select({ status: bookings.bookingStatus, n: sql<number>`count(*)::int` }).from(bookings).groupBy(bookings.bookingStatus),
    db.select({ total: sql<number>`coalesce(sum(${bookings.totalAmount}), 0)::float` }).from(bookings).where(eq(bookings.bookingStatus, "completed")),
    db.select({ role: users.role, n: sql<number>`count(*)::int` }).from(users).groupBy(users.role),
    countOf(services, eq(services.isActive, true)),
    countOf(categories, eq(categories.isActive, true)),
    db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(10),
  ]);
  const byStatus = new Map(statusCounts.map((r) => [r.status, r.n]));
  const byRole = new Map(userCounts.map((r) => [r.role, r.n]));

  return json({
    success: true,
    stats: {
      totalCustomers: byRole.get("customer") ?? 0,
      totalProfessionals: byRole.get("professional") ?? 0,
      totalServices,
      totalBookings: statusCounts.reduce((a, r) => a + r.n, 0),
      completedBookings: byStatus.get("completed") ?? 0,
      pendingBookings: byStatus.get("pending") ?? 0,
      totalCategories,
      totalRevenue: revenue?.total ?? 0,
    },
    recentBookings: await withCustomerAndService(recent),
    bookingsByStatus: BOOKING_STATUSES.map((s) => ({ _id: s, count: byStatus.get(s) ?? 0 })).filter((x) => x.count > 0),
    monthlyRevenue: [],
  });
});

route("GET", "/admin/users", "admin", async ({ query }) => {
  const conds: SQL[] = [];
  if (query.get("role")) conds.push(eq(users.role, query.get("role")!));
  const search = query.get("search");
  if (search) {
    const q = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    conds.push(or(ilike(users.name, q), ilike(users.email, q))!);
  }
  const where = conds.length ? and(...conds) : undefined;
  const { limit, offset } = paging(query, 20);
  const [total, rows] = await Promise.all([
    countOf(users, where),
    db.select().from(users).where(where).orderBy(asc(users.createdAt), asc(users.id)).limit(limit).offset(offset),
  ]);
  return json({ success: true, users: rows.map(safeUser), total });
});

route("GET", "/admin/bookings", "admin", async ({ query }) => {
  const where = bookingStatusFilter(query);
  const { limit, offset } = paging(query, 20);
  const [total, rows] = await Promise.all([
    countOf(bookings, where),
    db.select().from(bookings).where(where).orderBy(desc(bookings.createdAt)).limit(limit).offset(offset),
  ]);
  const proRows = rows.length
    ? await db.select().from(professionals).where(inArray(professionals.id, rows.map((b) => b.professionalId)))
    : [];
  const proUsers = await usersById(proRows.map((p) => p.userId));
  const proMap = new Map(proRows.map((p) => [p.id, { ...withId(p), userId: safeUser(proUsers.get(p.userId)) }]));

  const populated = await withCustomerAndService(rows);
  return json({
    success: true,
    bookings: populated.map((b, i) => ({ ...b, professionalId: proMap.get(rows[i].professionalId) ?? null })),
    total, totalPages: Math.ceil(total / limit),
  });
});

route("GET", "/admin/professionals", "admin", async ({ query }) => {
  const status = query.get("verificationStatus");
  const rows = await db
    .select()
    .from(professionals)
    .where(status ? eq(professionals.verificationStatus, status) : undefined)
    .orderBy(asc(professionals.id));
  return json({ success: true, professionals: await populatePros(rows), total: rows.length });
});

route("PUT", "/admin/users/:id/toggle-status", "admin", async ({ params }) => {
  const [user] = await db
    .update(users)
    .set({ isActive: sql`not ${users.isActive}` })
    .where(eq(users.id, params.id))
    .returning();
  if (!user) return fail(404, "User not found");
  return json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, user: safeUser(user) });
});

route("PUT", "/admin/professionals/:id/verify", "admin", async ({ params, body }) => {
  if (!["pending", "verified", "rejected"].includes(body.status)) return fail(400, "Invalid verification status");
  const [pro] = await db
    .update(professionals)
    .set({ verificationStatus: body.status })
    .where(eq(professionals.id, params.id))
    .returning();
  if (!pro) return fail(404, "Professional not found");
  return json({ success: true, professional: (await populatePros([pro]))[0] });
});

route("GET", "/admin/revenue", "admin", async () => {
  const completed = eq(bookings.bookingStatus, "completed");
  const [[totals], top] = await Promise.all([
    db.select({
      total: sql<number>`coalesce(sum(${bookings.totalAmount}), 0)::float`,
      n: sql<number>`count(*)::int`,
    }).from(bookings).where(completed),
    db.select({
      serviceId: bookings.serviceId,
      revenue: sql<number>`sum(${bookings.totalAmount})::float`,
      count: sql<number>`count(*)::int`,
    }).from(bookings).where(completed).groupBy(bookings.serviceId).orderBy(desc(sql`sum(${bookings.totalAmount})`)).limit(5),
  ]);
  const svcRows = top.length ? await db.select().from(services).where(inArray(services.id, top.map((t) => t.serviceId))) : [];
  const svcMap = new Map(svcRows.map((s) => [s.id, withId(s)]));

  return json({
    success: true,
    totalRevenue: totals?.total ?? 0,
    totalCompletedBookings: totals?.n ?? 0,
    topServices: top.map((t) => ({ _id: t.serviceId, revenue: t.revenue, count: t.count, service: [svcMap.get(t.serviceId)] })),
  });
});

// ─── Health check ────────────────────────────────────────────
route("GET", "/health", () => json({ status: "HomeEase API running", timestamp: new Date() }));

// ─── Entry point ─────────────────────────────────────────────
export default async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const method = req.method.toUpperCase();

  let matched: (typeof routes)[number] | undefined;
  let params: Record<string, string> = {};
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.pattern.exec(path);
    if (!m) continue;
    matched = r;
    params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    break;
  }
  if (!matched) return fail(404, `Route ${method} ${url.pathname} not found`);

  try {
    await ensureSeeded();

    let body: any = {};
    if (method !== "GET" && method !== "HEAD") {
      const text = await req.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          return fail(400, "Invalid JSON body");
        }
      }
    }

    const ctx: Ctx = { req, params, query: url.searchParams, body: body ?? {} };
    if (matched.guard) {
      const result = await authenticate(req);
      if (result instanceof Response) return result;
      ctx.user = result;
      if (matched.guard === "admin" && result.role !== "admin") return fail(403, "Admins only");
      if (matched.guard === "pro" && result.role !== "professional") return fail(403, "Professionals only");
    }
    return await matched.handler(ctx);
  } catch (err: any) {
    console.error(err);
    return fail(500, "Server error");
  }
};

export const config: Config = {
  path: "/api/*",
};
