import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongo";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uniqueId = searchParams.get("uniqueId");

    if (!uniqueId) {
      return NextResponse.json({ error: "Missing uniqueId" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const processedDataCollection = db.collection("processed_data");

    // Find the latest processed data for the uniqueId
    const latestResult = await processedDataCollection.findOne(
      { uniqueId },
      { sort: { timestamp: -1 } }
    );

    if (!latestResult) {
      return NextResponse.json({ error: "No result found for this uniqueId" }, { status: 404 });
    }

    return NextResponse.json(latestResult, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
