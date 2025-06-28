import { pgTable, serial, text, varchar,timestamp } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
    id: serial("id").primaryKey(),
    description: text("description").notNull(),
    status: varchar("status", { enum: ["pending", "in-progress", "completed"] }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
});
