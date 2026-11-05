import { sql } from "drizzle-orm";
import { pgTable, uniqueIndex, text, integer, boolean, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";

// Column keys mirror the field names the frontend already expects (camelCase),
// while the underlying Postgres columns use snake_case.

export type Address = {
  _id?: string;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isDefault?: boolean;
};

export type AvailabilitySlot = { day: string; startTime: string; endTime: string; isAvailable: boolean };
export type StatusChange = { status: string; changedAt: string; changedBy: string; note: string };

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  phone: text().notNull().default(""),
  password: text().notNull(),
  role: text().notNull().default("customer"),
  profileImage: text("profile_image").notNull().default(""),
  addresses: jsonb().$type<Address[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: text().primaryKey(),
  categoryName: text("category_name").notNull(),
  icon: text().notNull().default(""),
  description: text().notNull().default(""),
  image: text().notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const services = pgTable("services", {
  id: text().primaryKey(),
  serviceName: text("service_name").notNull(),
  category: text("category_id").notNull(),
  description: text().notNull().default(""),
  shortDescription: text("short_description").notNull().default(""),
  price: doublePrecision().notNull().default(0),
  priceType: text("price_type").notNull().default("starting_from"),
  duration: integer().notNull().default(60),
  features: jsonb().$type<string[]>().notNull().default([]),
  image: text().notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  totalBookings: integer("total_bookings").notNull().default(0),
  avgRating: doublePrecision("avg_rating").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const professionals = pgTable("professionals", {
  id: text().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceCategories: jsonb("service_categories").$type<string[]>().notNull().default([]),
  experience: integer().notNull().default(0),
  description: text().notNull().default(""),
  skills: jsonb().$type<string[]>().notNull().default([]),
  rating: doublePrecision().notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  completedJobs: integer("completed_jobs").notNull().default(0),
  hourlyRate: doublePrecision("hourly_rate").notNull().default(0),
  location: jsonb().$type<unknown>(),
  verificationStatus: text("verification_status").notNull().default("pending"),
  availability: jsonb().$type<AvailabilitySlot[]>().notNull().default([]),
  isAvailableToday: boolean("is_available_today").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
});

export const bookings = pgTable("bookings", {
  id: text().primaryKey(),
  bookingId: text("booking_code").notNull().unique(),
  customerId: text("customer_id").notNull(),
  professionalId: text("professional_id").notNull(),
  serviceId: text("service_id").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  timeSlot: text("time_slot").notNull(),
  address: jsonb().$type<Address>(),
  instructions: text().notNull().default(""),
  servicePrice: doublePrecision("service_price").notNull().default(0),
  additionalCharges: doublePrecision("additional_charges").notNull().default(0),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  bookingStatus: text("booking_status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("paid"),
  paymentMethod: text("payment_method").notNull().default("demo"),
  hasReview: boolean("has_review").notNull().default(false),
  statusHistory: jsonb("status_history").$type<StatusChange[]>().notNull().default([]),
  cancellationReason: text("cancellation_reason"),
  cancelledBy: text("cancelled_by"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // A professional can only hold one active (non-cancelled) booking per date + time slot.
  uniqueIndex("bookings_active_slot_idx")
    .on(t.professionalId, t.appointmentDate, t.timeSlot)
    .where(sql`${t.bookingStatus} <> 'cancelled'`),
]);

export const reviews = pgTable("reviews", {
  id: text().primaryKey(),
  customerId: text("customer_id").notNull(),
  professionalId: text("professional_id").notNull(),
  bookingId: text("booking_id").notNull(),
  serviceId: text("service_id").notNull(),
  rating: integer().notNull(),
  comment: text().notNull().default(""),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Small key/value table for server-side settings (e.g. the generated JWT signing secret).
export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});
