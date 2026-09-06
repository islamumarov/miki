import { NextRequest, NextResponse } from "next/server";
import { deleteNote, getDb, parseNoteInput, updateNote } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = Number((await params).id);
  try {
    const note = updateNote(getDb(), id, parseNoteInput(await req.json()));
    return note ? NextResponse.json(note) : NextResponse.json({ error: "not found" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const ok = deleteNote(getDb(), Number((await params).id));
  return new NextResponse(null, { status: ok ? 204 : 404 });
}
