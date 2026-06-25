import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phoneNumber,
      serviceInterested,
      travelDate,
      numberOfDays,
      preferredVehicleType,
      message,
      termsAccepted
    } = body;

    // 1. Server-side Validation
    if (!fullName || fullName.trim().length < 3) {
      return NextResponse.json({ error: "Full Name must be at least 3 characters." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian phone number." }, { status: 400 });
    }

    if (!serviceInterested || serviceInterested === "") {
      return NextResponse.json({ error: "Please select a service you are interested in." }, { status: 400 });
    }

    if (!termsAccepted) {
      return NextResponse.json({ error: "You must agree to the Terms and Conditions." }, { status: 400 });
    }

    // Parse values
    const sanitizedTravelDate = travelDate ? travelDate : null;
    const sanitizedNumDays = numberOfDays ? parseInt(numberOfDays, 10) : null;
    const sanitizedVehicleType = Array.isArray(preferredVehicleType) 
      ? preferredVehicleType.join(", ") 
      : preferredVehicleType || null;

    // 2. Insert into Supabase Table
    const { data, error } = await supabase
      .from("enquiries")
      .insert([
        {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          service_interested: serviceInterested,
          travel_date: sanitizedTravelDate,
          number_of_days: sanitizedNumDays,
          preferred_vehicle_type: sanitizedVehicleType,
          message: message ? message.trim() : null,
          status: "new"
        }
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }

    // 3. Mock Email Confirmation Log
    console.log("====================================================");
    console.log("📨 CONFIRMATION EMAIL MOCK DELIVERY LOG");
    console.log("----------------------------------------------------");
    console.log(`TO: ${email}`);
    console.log(`SUBJECT: Inquiry Received - The Heritage Travels`);
    console.log(`CONTENT:`);
    console.log(`Dear ${fullName},`);
    console.log(`Thank you for reaching out to The Heritage Travels! We have successfully received your inquiry for: "${serviceInterested}".`);
    console.log(`Our team will review your details (Phone: ${phoneNumber}) and contact you within 24 hours.`);
    console.log(`Safe Travels!`);
    console.log(`The Heritage Travels Team`);
    console.log("====================================================");

    return NextResponse.json({ success: true, message: "Enquiry submitted successfully!", data }, { status: 200 });

  } catch (err) {
    console.error("Enquiry API Exception:", err);
    return NextResponse.json({ error: "Failed to process enquiry: " + err.message }, { status: 500 });
  }
}
