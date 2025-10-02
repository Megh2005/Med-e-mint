import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI!;
const dbName = "doctorsearch";
const collectionName = "doctors";

interface Doctor {
    sl_no: number;
    name: string;
    age: number;
    short_description: string;
    specialization: string;
    experience: number;
    gender: string;
    rating: number;
    email: string;
}

const logger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
    success: (msg: string) => console.log(`[32m[SUCCESS] ${msg}[0m`),
};

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
    if (cachedClient) {
        return cachedClient;
    }

    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        cachedClient = client;
        logger.success("Connected to MongoDB successfully");
        return client;
    } catch (error) {
        logger.error(`MongoDB connection failed: ${error}`);
        throw new Error("Database connection failed");
    }
}

async function getDoctors(): Promise<Doctor[]> {
    try {
        const client = await getMongoClient();
        const db = client.db(dbName);
        const collection = db.collection<Doctor>(collectionName);
        const doctors = await collection.find({}).toArray();
        logger.info(`Retrieved ${doctors.length} doctors from database`);
        return doctors;
    } catch (error) {
        logger.error(`Error fetching doctors: ${error}`);
        return [];
    }
}

export async function GET() {
    try {
        logger.info("Fetching all doctors...");
        const doctors = await getDoctors();
        logger.success(`Successfully fetched ${doctors.length} doctors.`);
        return NextResponse.json(doctors);
    } catch (error) {
        logger.error(`Failed to fetch all doctors: ${error}`);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error occurred" },
            { status: 500 }
        );
    }
}
