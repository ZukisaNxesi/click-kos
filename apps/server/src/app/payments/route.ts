import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";


//new approach, add order to db, hold the order id in the payment table, then if that payment is unsuccessful, delete the order from the db
export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil" as any,
  });

  try {
    const { amount, email, order_id } = await req.json(); 
    const supabase = await createClient();

    // Determine app URL
    const fallbackOrigin = req.nextUrl.origin; // e.g., http://localhost:3000
    const configuredWebUrl =
      process.env.WEB_APP_URL ||
      process.env.NEXT_PUBLIC_WEB_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL;
    let appUrl = fallbackOrigin;
    if (configuredWebUrl && /^(http|https):\/\//i.test(configuredWebUrl)) {
      appUrl = configuredWebUrl;
    }

    // Insert payment row first
    const { data: payment, error } = await supabase
      .from("payment")
      .insert([
        {
          order_id,
          amount,
          method: "stripe",
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Build itemized line items from order items
    const { data: items, error: itemsError } = await supabase
      .from("order_item")
      .select("quantity, subtotal, menu_item:menu_item_id(name, price, item_image(url))")
      .eq("order_id", order_id);

    if (itemsError) throw itemsError;

    const line_items = (items || []).map((it: any) => ({
      price_data: {
        currency: "zar",
        product_data: {
          name: it.menu_item?.name ?? "Item",
          images: it.menu_item?.item_image?.[0]?.url ? [it.menu_item.item_image[0].url] : undefined,
        },
        unit_amount: Math.round((it.menu_item?.price ?? (it.subtotal / Math.max(1, it.quantity))) * 100),
      },
      quantity: it.quantity,
    }));

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items,
      mode: "payment",
      success_url: `${appUrl}/payments/success?payment_id=${payment.payment_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payments/cancel?order_id=${order_id}`,
      metadata: { payment_id: payment.payment_id},
    });

    return NextResponse.json({ payment, redirectUrl: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err }, { status: 400 });
  }
}
