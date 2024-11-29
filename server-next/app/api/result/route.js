import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongo";


export async function POST(req) {
  try {
    console.log(req.body);
    console.log("1");
    const data = await req.json();
    console.log("2");
    const { unique_id, raw_file_name, matched_file_name } = data;
    console.log("3");
    if (!unique_id || !raw_file_name   || !matched_file_name ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    console.log("4");

    const db = await connectToDatabase();
    const processedDataCollection = db.collection("processed_data");
    console.log("5");

    const newEntry = {
      unique_id,
      raw_file_name,
      // raw_file_freq,
      // raw_file_values,
      matched_file_name,
      // matched_file_freq,
      // matched_file_values,
      timestamp: new Date(),
    };
    console.log("6");

    await processedDataCollection.insertOne(newEntry);
    console.log("7");

    return NextResponse.json({ message: "Data stored successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}