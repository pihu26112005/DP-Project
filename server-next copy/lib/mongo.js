import { MongoClient } from "mongodb";

const uri = "mongodb+srv://piyushkumar26november:dpProjectPassword@dpcluster.qhzp2.mongodb.net/?retryWrites=true&w=majority&appName=dpcluster";

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function connectToDatabase() {
  const client = await clientPromise;
  return client.db("DP-Project");
}
