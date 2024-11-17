import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongo";

export async function POST(req) {
  try {
    const { uniqueId, data } = await req.json();

    if (!uniqueId || !data) {
      return NextResponse.json({ error: "Missing uniqueId or data" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const rawDataCollection = db.collection("raw_data");
    const processedDataCollection = db.collection("processed_data");

    // Save raw data to MongoDB
    const rawDataDoc = {
      uniqueId,
      data,
      timestamp: new Date(),
    };
    await rawDataCollection.insertOne(rawDataDoc);

    // Mock ML model prediction
    const prediction = Object.values(data).reduce((sum, val) => sum + val, 0); // Replace with your ML logic

    // Save processed data to MongoDB
    const processedDataDoc = {
      uniqueId,
      result: { prediction },
      timestamp: new Date(),
    };
    await processedDataCollection.insertOne(processedDataDoc);

    return NextResponse.json({ status: "success", prediction }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
