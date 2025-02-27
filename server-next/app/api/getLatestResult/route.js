import { Client, Databases } from "appwrite";
import { NextResponse } from "next/server";

// Initialize Appwrite Client
const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1") // Replace with your Appwrite endpoint
  .setProject("671f94c1001f0c9a88a1"); // Replace with your Appwrite Project ID

const databases = new Databases(client);

export async function GET(req) {
  try {
    const databaseId = "67b38d4c0016eef784f4"; // Replace with your Appwrite Database ID
    const collectionId = "67b38d55002d55adc257"; // Replace with your Appwrite Collection ID

    // Fetch all documents sorted by timestamp in descending order
    const response = await databases.listDocuments(databaseId, collectionId, [
      "orderDesc(timestamp)",
      "limit(1)" // Get only the latest document
    ]);

    if (response.documents.length > 0) {
      return NextResponse.json(response.documents[0], { status: 200 });
    } else {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
