import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET: Fetch user profile
const profileCache = new Map();
const cacheExpiry = () => Date.now() + 5 * 60 * 1000;
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    //return cached data
    if(profileCache.has(user.id) && profileCache.get(user.id).expiry > Date.now()){
      return NextResponse.json({ user: profileCache.get(user.id).data }, { status: 200 });
    }

    const { data: userData, error: userTableError } = await supabase
      .from("user")
      .select("user_id, email, first_name, last_name, role, profile_image_url")
      .eq("user_id", user.id)
      .single();

    if (userTableError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let studentData = null;
    if (userData.role === "student") {
      const { data: student, error: studentError } = await supabase
        .from("student")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!studentError && student) {
        studentData = student;
      }
    }

    profileCache.set(user.id, {data: { ...userData, student: studentData }, expiry: cacheExpiry()})

    return NextResponse.json({ user:  profileCache.get(user.id).data}, { status: 200 });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update student fields
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { faculty, year_of_study } = body;

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    if (!faculty || year_of_study === undefined) {
      return NextResponse.json({ error: "Faculty and year of study are required" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("student")
      .update({
        faculty,
        year_of_study: parseInt(year_of_study),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Student update error:", updateError);
      return NextResponse.json({ error: "Failed to update student data" }, { status: 500 });
    }

    profileCache.delete(user.id);
    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Upload profile image and update URL
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("files").getPublicUrl(filePath);

    const { data: newUserData, error: updateError } = await supabase
      .from("user")
      .update({ profile_image_url: publicUrl })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("DB update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile image URL" }, { status: 500 });
    }

    profileCache.delete(user.id);
    return NextResponse.json({ message: "Profile image updated", url: publicUrl, data: newUserData }, { status: 200 });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}