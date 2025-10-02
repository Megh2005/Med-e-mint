import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MONGO_URI = process.env.MONGODB_URI!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
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

interface MatchResult extends Doctor {
    reason: string;
    matchType: string;
    matchAccuracy: string;
    message: string;
}

const logger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
    success: (msg: string) => console.log(`\x1b[32m[SUCCESS] ${msg}\x1b[0m`),
    warning: (msg: string) => console.log(`\x1b[33m[WARNING] ${msg}\x1b[0m`),
    processing: (msg: string) => console.log(`\x1b[36m[PROCESSING] ${msg}\x1b[0m`),
};

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

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

async function getRandomDoctor(): Promise<Doctor | null> {
    try {
        const client = await getMongoClient();
        const db = client.db(dbName);
        const collection = db.collection<Doctor>(collectionName);
        const doctors = await collection
            .aggregate([{ $sample: { size: 1 } }])
            .toArray();
        logger.info("Retrieved random doctor from database");
        return (doctors[0] as Doctor) || null;
    } catch (error) {
        logger.error(`Error fetching random doctor: ${error}`);
        return null;
    }
}

function formatDoctorData(doctors: Doctor[]): string {
    return doctors
        .map((doctor, i) => {
            return `Doctor ${i + 1}:
Name: ${doctor.name}
Age: ${doctor.age}
Description: ${doctor.short_description}
Specialization: ${doctor.specialization}
Experience: ${doctor.experience} years
Gender: ${doctor.gender}
Rating: ${doctor.rating}/10
Email: ${doctor.email}
`;
        })
        .join("\n");
}

function generateAIPrompt(diseaseDescription: string, doctorsText: string): string {
    return `
Task: Based on the disease/symptom description and available doctors, decide:
1. Analyze the medical requirements and symptoms
2. Select the best-suited doctor (name only)
3. Provide a short justification for the selected doctor
4. Rate the match quality from 1-10 (10 being perfect match)

Rules:
- Do NOT mention doctors not in the list.
- Only suggest ONE doctor who is most suitable.
- Consider specialization, experience, and rating.
- If no doctor seems particularly suitable, rate the match as 5 or below.
- Format the response as:

Match Quality: <rating>/10

Selected Doctor:
<Doctor Name> - <Short reason for selection>

Disease/Symptom Description:
${diseaseDescription}

Available Doctors:
${doctorsText}
`;
}

async function findBestDoctor(diseaseDescription: string): Promise<MatchResult> {
    logger.processing("Analyzing disease/symptom requirements...");
    const doctors = await getDoctors();
    if (!doctors || doctors.length === 0) {
        throw new Error("No doctors found in the database.");
    }

    const doctorsText = formatDoctorData(doctors);
    const prompt = generateAIPrompt(diseaseDescription, doctorsText);

    try {
        logger.processing("AI processing disease description...");
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        const matchLine = responseText.match(/Match Quality:\s*(\d+)/i);
        const matchQuality = matchLine ? parseInt(matchLine[1]) : 5;
        const matchAccuracy = matchQuality * 10;

        let selectedDoctor: Doctor | null = null;
        let reason = "Selected based on available expertise";

        if (matchQuality >= 6) {
            logger.processing("Good match found, retrieving doctor details...");
            const lines = responseText.split("\n");
            for (const line of lines) {
                if (line.includes(" - ")) {
                    const parts = line.split(" - ");
                    if (parts.length >= 2) {
                        const name = parts[0].replace("Selected Doctor:", "").trim();
                        reason = parts[1].trim();

                        const client = await getMongoClient();
                        const db = client.db(dbName);
                        const collection = db.collection<Doctor>(collectionName);
                        const doctorDoc = await collection.findOne({
                            name: { $regex: new RegExp(name, "i") },
                        });

                        if (doctorDoc) {
                            selectedDoctor = doctorDoc;
                            break;
                        }
                    }
                }
            }
        }

        if (!selectedDoctor || matchQuality < 6) {
            logger.warning("No specific match found, selecting random doctor...");
            const randomDoctor = await getRandomDoctor();
            if (randomDoctor) {
                selectedDoctor = randomDoctor;
                reason =
                    matchQuality < 6
                        ? "No specific match found - showing available doctor"
                        : reason;
            }
        }

        if (!selectedDoctor) {
            throw new Error("Unable to find any doctor");
        }

        const matchType = matchQuality >= 6 ? "AI Selected" : "Random Selection";
        logger.success(`Match completed with ${matchAccuracy}% accuracy`);

        return {
            sl_no: selectedDoctor.sl_no,
            name: selectedDoctor.name,
            age: selectedDoctor.age,
            short_description: selectedDoctor.short_description,
            specialization: selectedDoctor.specialization,
            experience: selectedDoctor.experience,
            gender: selectedDoctor.gender,
            rating: selectedDoctor.rating,
            email: selectedDoctor.email,
            reason,
            matchType,
            matchAccuracy: `${matchAccuracy}%`,
            message:
                matchQuality >= 6
                    ? "Good match found based on symptoms/disease"
                    : "No specific match found - showing available doctor",
        };
    } catch (error) {
        logger.error("AI processing failed, falling back to random selection");
        const randomDoctor = await getRandomDoctor();
        if (randomDoctor) {
            return {
                sl_no: randomDoctor.sl_no,
                name: randomDoctor.name,
                age: randomDoctor.age,
                short_description: randomDoctor.short_description,
                specialization: randomDoctor.specialization,
                experience: randomDoctor.experience,
                gender: randomDoctor.gender,
                rating: randomDoctor.rating,
                email: randomDoctor.email,
                reason: "AI processing failed - showing available doctor",
                matchType: "Random Selection",
                matchAccuracy: "50%",
                message: "AI processing failed - showing available doctor",
            };
        }
        throw new Error(`Error processing AI response: ${error}`);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { description, userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User not authenticated." }, { status: 401 });
        }

        if (!description || description.trim().length < 20) {
            return NextResponse.json(
                {
                    error: "Please provide a detailed disease/symptom description (min 20 characters).",
                },
                { status: 400 }
            );
        }

        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const searchLimit = 3;

        let searchCount = 0;
        if (userDoc.exists()) {
            searchCount = userDoc.data()?.searchCount || 0;
        }

        if (searchCount >= searchLimit) {
            return NextResponse.json(
                { 
                    error: "You have reached your maximum search limit.",
                    limitReached: true 
                },
                { status: 429 }
            );
        }

        logger.processing("Starting doctor matching process...");
        const result = await findBestDoctor(description);
        logger.success("Doctor matching process completed successfully!");

        if (userDoc.exists()) {
            await updateDoc(userDocRef, { searchCount: increment(1) });
        } else {
            await setDoc(userDocRef, { searchCount: 1 });
        }

        return NextResponse.json(result);
    } catch (error) {
        logger.error(`Doctor matching failed: ${error}`);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error occurred" },
            { status: 500 }
        );
    }
}