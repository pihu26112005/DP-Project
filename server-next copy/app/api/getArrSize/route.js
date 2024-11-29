import connectToDatabase from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("processed_data");
    const count = await collection.countDocuments();
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch results count' }, { status: 500 });
  }
}