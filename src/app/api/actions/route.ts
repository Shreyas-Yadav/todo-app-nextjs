'use server';

import { db } from '@/db/db';
import { tasks } from '@/db/schema';
import { NextResponse,NextRequest } from 'next/server';

// READ
export async function GET() {
  var allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);
  return NextResponse.json(allTasks);
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



