# Database Setup with Drizzle ORM

This guide provides step-by-step instructions for setting up a database using Drizzle ORM with PostgreSQL and Neon Database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Provider Setup (Neon)](#database-provider-setup-neon)
4. [Environment Configuration](#environment-configuration)
5. [Drizzle Configuration](#drizzle-configuration)
6. [Database Schema Definition](#database-schema-definition)
7. [Database Connection Setup](#database-connection-setup)
8. [Running Migrations](#running-migrations)
9. [Usage Examples](#usage-examples)
10. [Common Commands](#common-commands)

## Prerequisites

- Node.js (v18 or higher)
- A Neon Database account (or any PostgreSQL provider)
- Basic knowledge of TypeScript/JavaScript

## Installation

Install the required dependencies:

```bash
# Core Drizzle ORM packages
npm install drizzle-orm @neondatabase/serverless

# Development tools
npm install -D drizzle-kit

# Environment variables support
npm install dotenv
```

## Database Provider Setup (Neon)

1. **Create a Neon Account**
   - Go to [Neon Console](https://console.neon.tech/)
   - Sign up for a free account
   - Create a new project

2. **Get Database Connection String**
   - In your Neon project dashboard
   - Go to "Connection Details"
   - Copy the connection string (it should look like: `postgresql://username:password@host/database?sslmode=require`)

## Environment Configuration

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

**Important:** Add `.env.local` to your `.gitignore` file to keep your credentials secure.

## Drizzle Configuration

Create [`drizzle.config.ts`](drizzle.config.ts) in your project root:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Configuration Options Explained:

- **`schema`**: Path to your database schema file
- **`out`**: Directory where migration files will be generated
- **`dialect`**: Database type (postgresql, mysql, sqlite)
- **`dbCredentials`**: Database connection configuration

## Database Schema Definition

Create [`src/db/schema.ts`](src/db/schema.ts) to define your database tables:

```typescript
import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  status: varchar("status", { 
    enum: ["pending", "in-progress", "completed"] 
  }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
});
```

### Schema Types Available:

- **`serial()`**: Auto-incrementing integer
- **`text()`**: Variable-length text
- **`varchar()`**: Fixed-length string with optional enum
- **`timestamp()`**: Date and time
- **`boolean()`**: True/false values
- **`integer()`**: Whole numbers
- **`real()`**: Floating-point numbers

### Common Modifiers:

- **`.primaryKey()`**: Sets as primary key
- **`.notNull()`**: Field cannot be null
- **`.default(value)`**: Sets default value
- **`.unique()`**: Ensures unique values

## Database Connection Setup

Create [`src/db/db.ts`](src/db/db.ts) for database connection:

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Alternative Database Providers:

#### For Vercel Postgres:
```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

#### For PlanetScale (MySQL):
```typescript
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { connect } from '@planetscale/database';
import * as schema from './schema';

const connection = connect({
  url: process.env.DATABASE_URL
});

export const db = drizzle(connection, { schema });
```

## Running Migrations

Add migration scripts to your [`package.json`](package.json):

```json
{
  "scripts": {
    "db:generate": "npx drizzle-kit generate",
    "db:migrate": "npx drizzle-kit migrate",
    "db:push": "npx drizzle-kit push",
    "db:studio": "npx drizzle-kit studio"
  }
}
```

### Migration Workflow:

1. **Generate Migration Files**:
   ```bash
   npm run db:generate
   ```
   Or directly: `npx drizzle-kit generate`
   
   This creates SQL migration files in `src/db/drizzle/`

2. **Apply Migrations**:
   ```bash
   npm run db:migrate
   ```
   Or directly: `npx drizzle-kit migrate`
   
   This executes the migration files against your database

3. **Push Schema (Development)**:
   ```bash
   npm run db:push
   ```
   Or directly: `npx drizzle-kit push`
   
   This directly pushes schema changes without generating migration files (useful for development)

4. **Open Drizzle Studio**:
   ```bash
   npm run db:studio
   ```
   Or directly: `npx drizzle-kit studio`
   
   This opens a web-based database browser at `https://local.drizzle.studio`

## Usage Examples

### Basic CRUD Operations

```typescript
import { db } from '@/db/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Create a new task
const newTask = await db.insert(tasks).values({
  description: "Complete the project",
  status: "pending"
}).returning();

// Read all tasks
const allTasks = await db.select().from(tasks);

// Read tasks with conditions
const pendingTasks = await db
  .select()
  .from(tasks)
  .where(eq(tasks.status, 'pending'));

// Update a task
const updatedTask = await db
  .update(tasks)
  .set({ 
    status: 'completed',
    updatedAt: new Date()
  })
  .where(eq(tasks.id, 1))
  .returning();

// Delete a task
const deletedTask = await db
  .delete(tasks)
  .where(eq(tasks.id, 1))
  .returning();
```

### Advanced Queries

```typescript
import { and, or, like, gt, lt, desc } from 'drizzle-orm';

// Multiple conditions
const filteredTasks = await db
  .select()
  .from(tasks)
  .where(
    and(
      eq(tasks.status, 'pending'),
      like(tasks.description, '%project%')
    )
  );

// Ordering and limiting
const recentTasks = await db
  .select()
  .from(tasks)
  .orderBy(desc(tasks.createdAt))
  .limit(10);

// Count records
const taskCount = await db
  .select({ count: sql<number>`count(*)` })
  .from(tasks);
```

### Using in API Routes (Next.js)

```typescript
// app/api/tasks/route.ts
import { db } from '@/db/db';
import { tasks } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks);
    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    
    const newTask = await db.insert(tasks).values({
      description,
      status: 'pending'
    }).returning();
    
    return NextResponse.json(newTask[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` or `npx drizzle-kit generate` | Generate migration files from schema changes |
| `npm run db:migrate` or `npx drizzle-kit migrate` | Apply pending migrations to database |
| `npm run db:push` or `npx drizzle-kit push` | Push schema changes directly (dev only) |
| `npm run db:studio` or `npx drizzle-kit studio` | Open Drizzle Studio database browser |
| `npx drizzle-kit drop` | Drop migration files |
| `npx drizzle-kit check` | Check for schema issues |

## Best Practices

1. **Environment Variables**: Always use environment variables for database credentials
2. **Migrations**: Use migrations for production, `db:push` for development
3. **Schema Organization**: Keep related tables in the same schema file or organize by feature
4. **Type Safety**: Leverage TypeScript types generated by Drizzle
5. **Error Handling**: Always wrap database operations in try-catch blocks
6. **Connection Pooling**: Use connection pooling for production applications

## Troubleshooting

### Common Issues:

1. **"Cannot find module 'drizzle-orm'"**
   - Ensure all dependencies are installed: `npm install`

2. **"DATABASE_URL is not defined"**
   - Check your `.env.local` file exists and contains the correct variable
   - Restart your development server after adding environment variables

3. **Migration errors**
   - Ensure your database is accessible
   - Check that the DATABASE_URL is correct
   - Verify your schema syntax

4. **Type errors**
   - Run `npm run db:generate` to update types
   - Restart your TypeScript server in your IDE

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Neon Database Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)