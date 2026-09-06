import { NextRequest, NextResponse } from "next/server";
import { createNote, getDb, listNotes, parseNoteInput } from "@/lib/db";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  return NextResponse.json(listNotes(getDb(), { archived: p.get("archived") === "1", q: p.get("q") ?? "" }));
}

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json(createNote(getDb(), parseNoteInput(await req.json())), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}
