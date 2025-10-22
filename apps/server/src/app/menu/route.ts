// app/api/menu/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

function validateMenuItem(data: any) {
  const errors: Record<string, string> = {};
  if (!data.name || typeof data.name !== "string")
    errors.name = "Name is required and must be a string.";
  if (data.price === undefined || typeof data.price !== "number" || data.price < 0)
    errors.price = "Price is required and must be a non-negative number.";
  if (!data.description || typeof data.description !== "string")
    errors.description = "Description is required and must be a string.";
  if (data.available !== undefined && typeof data.available !== "boolean")
    errors.available = "Available must be a boolean.";
  if (!data.category || typeof data.category !== "string")
    errors.category = "Category is required and must be a string.";
  return Object.keys(errors).length > 0 ? errors : null;
}

const menuCache = new Map();
const cacheExpiry = () => Date.now() + 60 * 1000;//1 minute
// GET /api/menu?available=true&category=drinks&keyword=coffee
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const cacheKey = request.url.toString();
  //get the menu from cache and send it to client.
  if(menuCache.has(cacheKey) && menuCache.get(cacheKey).expiry > Date.now()){
    let data = menuCache.get(cacheKey).data;
    return NextResponse.json(
      { message: "Menu items fetched successfully from menu cache", data },
      { status: 200 }
    );
  }

  let query = supabase
    .from("menu_item")
    .select(`
      *,
      item_image(url)
    `);

  // Optional filters
  if (searchParams.get("available")) {
    query = query.eq("available", searchParams.get("available") === "true");
  }
  if (searchParams.get("category")) {
    query = query.eq("category", searchParams.get("category"));
  }
  // Optional keyword search (case-insensitive)
  if (searchParams.get("keyword")) {
    query = query.ilike("name", `%${searchParams.get("keyword")}%`);

  }

  
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  //set the cache only if there is data
  if(data.length > 0){
    //set cache
    menuCache.set(cacheKey, {data,expiry: cacheExpiry()});
  }

  return NextResponse.json(
    { message: "Menu items fetched successfully from menu ", data },
    { status: 200 }
  );

}

// POST /api/menu
export async function POST(request: Request) {


  const supabase = await createClient();
  const body = await request.json();
  const { name, price, description, available, category, imageUrl, image } = body;

  const validationErrors = validateMenuItem(body);
  if (validationErrors) {
    return NextResponse.json({ error: validationErrors }, { status: 400 });
  }

  // Insert the menu item first
  const { data: itemData, error: itemError } = await supabase
    .from("menu_item")
    .insert([{ name, price, description, available, category }])
    .select()
    .single();

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  // If imageUrl is provided, insert into item_image
  let imageRecord = null;
  if (imageUrl) {
    const { data: imageData, error: imageError } = await supabase
      .from("item_image")
      .insert([{ item_id: itemData.item_id, url: imageUrl }])
      .select()
      .single();

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 500 });
    }
    imageRecord = imageData;
  }

  return NextResponse.json(
    { message: "Menu item added successfully", data: { ...itemData, image: imageRecord } },

    { status: 201 }
  );
}
