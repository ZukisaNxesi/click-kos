'use client';

import type { cartItem } from '@/context/CartContext';
import { getAccessToken, getUserData } from '@/lib/auth';
import { toast } from 'sonner';

interface CheckoutOptions {
  cartItems: cartItem[];
  clearCart: () => void;
  onSuccess?: () => void;
}

export const processCheckout = async ({
  cartItems,
  clearCart,
  onSuccess,
}: CheckoutOptions): Promise<boolean> => {
  toast("Loading, Please wait...", {
    description: "Processing your order..."
  })
  if (!cartItems.length) {
    toast.error('Your cart is empty.');
    return false;
  }

  const userData = getUserData();
  const token = getAccessToken();

  if (!userData || !token) {
    toast.error('Please log in to checkout');
    return false;
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!serverUrl) {
    toast.error('Server URL not configured');
    console.error('NEXT_PUBLIC_SERVER_URL is not set');
    return false;
  }

  try {

    const itemCounts = cartItems.reduce<Record<string, number>>((acc, item) => {
      const key = item.id;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const orderItems = Object.entries(itemCounts).map(([id, quantity]) => {
      const item = cartItems.find((cartItem) => cartItem.id === id);

      if (!item) {
        throw new Error(`Cart item with id ${id} not found`);
      }

      return {
        product_id: item.id,
        quantity,
        price: item.price,
      };
    });

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    const orderResponse = await fetch(`${serverUrl}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: orderItems }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      toast('Order creation failed: '+errorText);
      throw new Error(`Failed to create order (${orderResponse.status})`);
    }

    const { order } = await orderResponse.json();

    toast("Order processed successfully.",{
      description: "Redirecting you to payment page."
    })


    const paymentResponse = await fetch(`${serverUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: (order as any).id ?? (order as any).order_id,
        amount: total,
        email: userData.email,
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Payment initiation failed:', errorText);
      throw new Error(`Failed to initiate payment (${paymentResponse.status})`);
    }

    const { redirectUrl } = await paymentResponse.json();

    if (!redirectUrl) {
      throw new Error('No redirect URL received from payment service');
    }

    toast("Redirecting you to payment page...",{
      description: `Please wait as we take you to stripe to complete you order.`
    })

    //onSuccess?.();
    window.location.href = redirectUrl;
  

    return true;
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    toast.error(`Checkout failed: ${errorMessage}`);
    return false;
  }
};
