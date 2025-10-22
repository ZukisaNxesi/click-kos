import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

export async function PUT(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil" as any,
  });
  const supabase = await createClient();

  try {
    const sig = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    if (!sig) {
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.payment_id;

      if (!paymentId) {
        console.warn("❗ Missing payment_id in metadata");
        return NextResponse.json({ received: true });
      }

      // Update payment status → success
      const { data: paymentData, error: paymentErr } = await supabase
        .from("payment")
        .update({ status: "success" })
        .eq("payment_id", paymentId)
        .select("payment_id, amount, metadata, user_id")
        .single();

      if (paymentErr) throw paymentErr;

      // Retrieve user_id and cart data from metadata (stored when creating session)
      const userId = session.metadata?.user_id || paymentData.user_id;
      const rawCart = session.metadata?.cart_items;
      const cartItems = rawCart ? JSON.parse(rawCart) : [];

      if (!userId) {
        console.error("❌ Missing user_id for payment:", paymentId);
        return NextResponse.json({ received: true });
      }

      // Create order now that payment is successful
      const { data: orderData, error: orderErr } = await supabase
        .from("order")
        .insert([
          {
            user_id: userId,
            total_amount: paymentData.amount,
            status: "paid",
            payment_id: paymentId,
            ordered_at: new Date().toISOString(),
          },
        ])
        .select("order_id")
        .single();

      if (orderErr) throw orderErr;

      const orderId = orderData.order_id;

      // Add order items (if provided)
      if (cartItems.length > 0) {
        const orderItems = cartItems.map((item: any) => ({
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          ordered_at: new Date().toISOString(),
        }));

        const { error: itemErr } = await supabase.from("order_item").insert(orderItems);
        if (itemErr) throw itemErr;
      }

      console.log(`✅ Payment ${paymentId} succeeded — Order ${orderId} created.`);
    }

    // Handle failed payments
    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const paymentId = intent.metadata?.payment_id;

      if (paymentId) {
        await supabase.from("payment").update({ status: "failed" }).eq("payment_id", paymentId);
      }
    }

    // Handle expired sessions
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.payment_id;
      if (paymentId) {
        await supabase.from("payment").update({ status: "expired" }).eq("payment_id", paymentId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
