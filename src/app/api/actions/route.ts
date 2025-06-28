'use server';

import { db } from '@/db/db';
import { tasks } from '@/db/schema';
import { NextResponse, NextRequest } from 'next/server';
import { count, desc, asc, eq } from 'drizzle-orm';

// READ
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Pagination parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  // Filter parameters
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
  try {
    let tasksResult;
    let totalCountResult;
    
    // Handle different combinations of filters and sorting
    if (status && status !== 'all' && ['pending', 'in-progress', 'completed'].includes(status)) {
      const statusValue = status as 'pending' | 'in-progress' | 'completed';
      
      // Get filtered and sorted tasks
      if (sortBy === 'id') {
        tasksResult = sortOrder === 'desc' 
          ? await db.select().from(tasks).where(eq(tasks.status, statusValue)).orderBy(desc(tasks.id)).limit(limit).offset(offset)
          : await db.select().from(tasks).where(eq(tasks.status, statusValue)).orderBy(asc(tasks.id)).limit(limit).offset(offset);
      } else if (sortBy === 'description') {
        tasksResult = sortOrder === 'desc'
          ? await db.select().from(tasks).where(eq(tasks.status, statusValue)).orderBy(desc(tasks.description)).limit(limit).offset(offset)
          : await db.select().from(tasks).where(eq(tasks.status, statusValue)).orderBy(asc(tasks.description)).limit(limit).offset(offset);
      } else {
        tasksResult = sortOrder === 'desc'
          ? await db.select().from(tasks).where(eq(tasks.status, statusValue)).orderBy(desc(tasks.createdAt)).limit(limit).offset(offset)
          : await db.select().from(tasks).where(eq(tasks.status, statusValue)).orderBy(asc(tasks.createdAt)).limit(limit).offset(offset);
      }
      
      // Get filtered count
      totalCountResult = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, statusValue));
    } else {
      // Get all tasks with sorting
      if (sortBy === 'id') {
        tasksResult = sortOrder === 'desc'
          ? await db.select().from(tasks).orderBy(desc(tasks.id)).limit(limit).offset(offset)
          : await db.select().from(tasks).orderBy(asc(tasks.id)).limit(limit).offset(offset);
      } else if (sortBy === 'description') {
        tasksResult = sortOrder === 'desc'
          ? await db.select().from(tasks).orderBy(desc(tasks.description)).limit(limit).offset(offset)
          : await db.select().from(tasks).orderBy(asc(tasks.description)).limit(limit).offset(offset);
      } else {
        tasksResult = sortOrder === 'desc'
          ? await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(limit).offset(offset)
          : await db.select().from(tasks).orderBy(asc(tasks.createdAt)).limit(limit).offset(offset);
      }
      
      // Get total count
      totalCountResult = await db.select({ count: count() }).from(tasks);
    }
    
    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      tasks: tasksResult,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  const body = await request.json();
  const { description } = body;

  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  try {
    const newTask = await db.insert(tasks).values({ description }).returning();
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
