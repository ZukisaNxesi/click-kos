import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// Validation function
function validateMenuItem(data: any, options: { partial?: boolean } = {}) {
  const { partial = false } = options;
  const errors: Record<string, string> = {};

  if (!partial || "name" in data) {
    if (!data.name || typeof data.name !== "string") {
      errors.name = "Name is required and must be a string.";
    }
  }

  if (!partial || "price" in data) {
    if (data.price === undefined || typeof data.price !== "number" || data.price < 0) {
      errors.price = "Price is required and must be a non-negative number.";
    }
  }

  if (!partial || "description" in data) {
    if (!data.description || typeof data.description !== "string") {
      errors.description = "Description is required and must be a string.";
    }
  }

  if (!partial || "category" in data) {
    if (!data.category || typeof data.category !== "string") {
      errors.category = "Category is required and must be a string.";
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

// GET /api/menu/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("menu_item")
        .select(`
            *,
            item_image(url)
        `)
        .eq("item_id", id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ message: "Menu item fetched successfully", data }, { status: 200 });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const contentType = req.headers.get("content-type") || "";
  let body: any = {};
  let file: File | null = null;

  // Handle multipart/form-data or JSON
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    body = Object.fromEntries(formData.entries());
  } else {
    body = await req.json();
  }

  // Separate image-related fields
  const { file: _file, imageUrl, ...updateFields } = body;

  // Validate menu item fields if provided
  if (Object.keys(updateFields).length > 0) {
    const errors = validateMenuItem(updateFields, { partial: true });
    if (errors) return NextResponse.json({ error: errors }, { status: 400 });
  }

  //  Update menu item fields if any
  let menuItemData = null;
  if (Object.keys(updateFields).length > 0) {
    const { data, error } = await supabase
      .from("menu_item")
      .update(updateFields)
      .eq("item_id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    menuItemData = data;
  }

  // Handle image update (file upload or imageUrl)
  let imageRecord = null;

  if (file || imageUrl) {
    let finalUrl = imageUrl || "";

    // Handle file upload if file exists
    if (file) {
      const filename = `${randomUUID()}-${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("menu_images")
        .upload(filename, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

      finalUrl = supabase.storage.from("menu_images").getPublicUrl(filename).data.publicUrl;
    }

    // Check if image already exists
    const { data: existing, error: fetchError } = await supabase
      .from("item_image")
      .select("*")
      .eq("item_id", id)
      .maybeSingle();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    if (existing) {
      const { data, error } = await supabase
        .from("item_image")
        .update({ url: finalUrl })
        .eq("item_id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      imageRecord = data;
    } else {
      const { data, error } = await supabase
        .from("item_image")
        .insert([{ item_id: id, url: finalUrl }])
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      imageRecord = data;
    }
  }

  //  Fetch existing menu item if it wasn't updated
  if (!menuItemData) {
    const { data, error } = await supabase
      .from("menu_item")
      .select("*")
      .eq("item_id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    menuItemData = data;
  }

  // Fetch existing image if it wasn't updated
  if (!imageRecord) {
    const { data, error } = await supabase
      .from("item_image")
      .select("*")
      .eq("item_id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    imageRecord = data || null;
  }

  return NextResponse.json(
    {
      message: "Menu item updated successfully",
      data: { ...menuItemData, image: imageRecord },
    },
    { status: 200 }
  );
}



// DELETE /api/menu/:id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase.from("menu_item").delete().eq("item_id", id);

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Menu item deleted successfully" }, { status: 200 });
}

// POST /api/menu/:id/images
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const supabase = await createClient();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file)
        return NextResponse.json({ error: "File is required" }, { status: 400 });

    // Upload to Supabase Storage
    const filename = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from("menu_images")
        .upload(filename, file);

    if (uploadError)
        return NextResponse.json({ error: uploadError.message }, { status: 500 });

    // Get public URL
    const publicUrl = supabase
        .storage
        .from("menu_images")
        .getPublicUrl(filename).data.publicUrl;

    // Insert into item_image table
    const { data: insertedImage, error: insertError } = await supabase
        .from("item_image")
        .insert([{ item_id: id, url: publicUrl }])
        .select();

    if (insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json(
        { message: "Image uploaded successfully", url: publicUrl, data: insertedImage },
        { status: 201 }
    );
}
