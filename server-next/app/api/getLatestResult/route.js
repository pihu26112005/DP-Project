import connectToDatabase from "@/lib/mongo";
import { NextResponse } from "next/server";


export async function GET(req) {
  try {
    const db = await connectToDatabase();
    const processedDataCollection = db.collection("processed_data");

    const latestResult = await processedDataCollection.findOne({}, { sort: { timestamp: -1 } });

    if (latestResult) {
      return NextResponse.json(latestResult, { status: 200 });
    } else {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}