import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Settings from "@/models/Settings";

export async function GET() {
  await connectDB();
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ totalTables: 12 });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  await connectDB();
  const body = await req.json();
  
  // Update the single settings document
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(body);
  } else {
    // Start with a new object literal with type 'any' to allow dynamic indexing
    const updates: any = {};
    if (body.totalTables !== undefined) updates.totalTables = body.totalTables;
    
    // Use the updates object
    await Settings.updateOne({}, { $set: updates });
    // Re-fetch to return latest
    settings = await Settings.findOne();
  }
  
  return NextResponse.json(settings);
}
