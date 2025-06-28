import { db } from '@/db/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse, NextRequest } from 'next/server';

export async function DELETE(request: NextRequest, context: { params: { task: string } }) {
  const { task } = await context.params;

  if (!task) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  try {
    await db.delete(tasks).where(eq(tasks.id, Number(task)));
    return NextResponse.json({ message: 'success', error: null }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}




export async function PUT(request: NextRequest, context: { params: { task: string } }) {
  const { task } = await context.params;
  const body = await request.json();
  const { description } = body;

  if (!task || !description) {
    return NextResponse.json({ error: 'Task ID and description are required' }, { status: 400 });
  }

  try {
    const updatedTask = await db
      .update(tasks)
      .set({ description,updatedAt: new Date() })
      .where(eq(tasks.id, Number(task)))
      .returning();

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}


export async function PATCH(request : NextRequest, context: {params : {task: string}}) {
  const { task } = await context.params;
  const body = await request.json();
  const { status } = body;

  if (!task || !status) {
    return NextResponse.json({ error: 'Task ID and status is missing' }, { status: 400 });
  }

  try {
    const updatedTask = await db
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(tasks.id, Number(task)))
      .returning();

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
