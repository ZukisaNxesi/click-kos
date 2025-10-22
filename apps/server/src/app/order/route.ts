import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthorization } from "@/utils/supabase/server";

const userOrderCache = new Map();//in memory cache
const cacheExpiry = () => Date.now() + 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  try {
    const { user, error: userError } = await getAuthorization(req, supabase);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user role
    const { data: dbUser, error: dbUserError } = await supabase
      .from("user")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (dbUserError || !dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roleValue = (dbUser.role || '').toString().toLowerCase();
    const isStaff = roleValue === "staff" || roleValue === "admin";

    // Build query
    let query = supabase
      .from("order")
      .select("*, order_item(*, menu_item(name, price))")
      .order("ordered_at", { ascending: false });

    if (isStaff) {
      query = query.eq("status", "pending"); // staff sees only new orders
    } else {
      //run the cache for the user
      const cachedOrders = userOrderCache.get(user.id);
      //if the cache exists and has not expired.
      if (cachedOrders && cachedOrders.expiry > Date.now()) {
          console.log("From cache");
          return NextResponse.json({
          currentOrders: userOrderCache.get(user.id).currentOrders,
          pastOrders: userOrderCache.get(user.id).pastOrders,
        });
      }

      //it will pass if the cache has expired
      query = query.eq("user_id", user.id); // user sees only their orders
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    if (!isStaff) {
      // Split orders for frontend: current vs past
      const currentOrders = orders.filter((o: any) => o.status !== "completed" && o.status !== "cancelled");
      const pastOrders = orders.filter((o: any) => o.status === "completed" || o.status === "cancelled");

      const mapOrder = (o: any) => ({
        id: o.id,
        item: (o.order_item ?? [])
          .map((i: any) => i?.name ?? i?.menu_item?.name ?? "")
          .filter((n: string) => n && n.trim().length > 0)
          .join(', '),
        price: (o.order_item ?? []).reduce((sum: number, i: any) => sum + (i?.subtotal ?? 0), 0),
        status: o.status,
        eta: o.eta,
        date: o.ordered_at,
      });

      if(dbUser.role === "student"){
        //add to cache
        userOrderCache.set(user.id, { currentOrders: currentOrders.map(mapOrder), pastOrders: pastOrders.map(mapOrder), expiry: cacheExpiry() });
        return NextResponse.json({
          currentOrders: userOrderCache.get(user.id).currentOrders,
          pastOrders: userOrderCache.get(user.id).pastOrders,
        });
      }
    }

    return NextResponse.json({ orders }); // staff/admin view
  } catch (err: any) {
    console.error("Orders fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  try {
    const { user, error: userError } = await getAuthorization(req, supabase);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { items } = await req.json();
    if (!items || items.length === 0) return NextResponse.json({ error: "No items provided" }, { status: 400 });

    const orderItems = items.map((i: any) => ({
      menu_item_id: i.menu_item_id ?? i.product_id,
      quantity: i.quantity,
      subtotal: i.price * i.quantity,
    }));

    const total_amount = orderItems.reduce((sum: number, i: { subtotal: number; }) => sum + i.subtotal, 0);

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("order")
      .insert({ user_id: user.id, total_amount, status: "pending" })
      .select()
      .single();
    if (orderError) throw orderError;

    // Insert order items (support schemas where PK is order_id instead of id)
    const newOrderId = (order as any).order_id ?? (order as any).id;
    const withOrderId = orderItems.map((i: any) => ({ ...i, order_id: newOrderId }));
    const { error: itemsError } = await supabase.from("order_item").insert(withOrderId);
    if (itemsError) throw itemsError;

    // Notification
    await supabase.from("notification").insert({
      user_id: user.id,
      message: `Order #${order.order_id.slice(0, 6)} placed, awaiting payment.`,
      type: "Order confirmation",
    });

    // Normalize response to always include id
    const normalizedOrder = { id: newOrderId, ...order };
    return NextResponse.json({ order: normalizedOrder, orderItems: withOrderId });
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
