"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { cartItem } from '@/context/CartContext';
import { getAccessToken, getUserData } from '@/lib/auth';
import { useCart } from '@/context/CartContext';
import { toast } from "sonner";


function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("payment_id");
  const sessionId = searchParams.get("session_id");

  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let attempts = 0;
    setIsPolling(true);

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/payments/${paymentId}`
        );
        if (response.ok) {
          const data = await response.json();
          const payment = (data && (data.payment ?? data)) as
            | { status?: "pending" | "success" | "failed" }
            | undefined;
          const status = payment?.status ?? "pending";
          setPaymentStatus(status);

          // Stop polling when terminal status reached
          if (status === "success" || status === "failed") {
            const { cartItems } = useCart();

            if (paymentStatus === "success") {
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/order`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getAccessToken()}`,
                  },
                  body: JSON.stringify({
                    items: cartItems.map(item => ({
                      product_id: item.id,
                      quantity: 1,
                      price: item.price,
                    })),
                  }),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  toast('Order creation failed: ' + errorText);
                  throw new Error(`Failed to create order (${response.status})`);
                }
              } catch (error) {
                console.error("Error creating order:", error);
              }
            }


            if (interval) clearInterval(interval);
            interval = null;
            setIsPolling(false);
            setLoading(false);
            return;
          }
        } else {
          setPaymentStatus("failed");
          if (interval) clearInterval(interval);
          interval = null;
          setIsPolling(false);
          setLoading(false);
          return;
        }

        // Fallback: ask server to confirm via Stripe session if still pending
        if (sessionId) {
          const confirm = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/payments/confirm`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: sessionId,
                payment_id: paymentId,
              }),
            }
          );
          if (confirm.ok) {
            const { status } = await confirm.json();
            if (status === "success" || status === "failed") {
              setPaymentStatus(status);
              if (interval) clearInterval(interval);
              interval = null;
              setIsPolling(false);
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        // keep trying until attempts exhausted
      } finally {
        // do not stop loading on each tick; we stop when polling finishes
      }
    };

    // initial check
    checkPaymentStatus();

    // poll every 2s up to 10 attempts (~20s) to allow webhook processing
    interval = setInterval(async () => {
      attempts += 1;
      if (attempts > 10) {
        if (interval) clearInterval(interval);
        interval = null;
        setIsPolling(false);
        setLoading(false);
        return;
      }
      await checkPaymentStatus();
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentId]);

  if (loading || isPolling) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7965C1] mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {paymentStatus === "success" ? (
            <>
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your order. Your payment has been processed
                successfully.
              </p>

              <a
                href="/orders"
                className="inline-block bg-[#7965C1] hover:bg-[#5d4fa8] text-white font-semibold py-2 px-6 rounded-md transition duration-200"
              >
                View My Orders
              </a>
            </>
          ) : paymentStatus === "failed" ? (
            <>
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-600 mb-6">
                There was an issue processing your payment. Please try again or
                contact support.
              </p>
              <a
                href="/cart"
                className="inline-block bg-[#7965C1] hover:bg-[#5d4fa8] text-white font-semibold py-2 px-6 rounded-md transition duration-200"
              >
                Back to Cart
              </a>
            </>
          ) : (
            <>
              <div className="text-yellow-500 text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Payment Processing
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment is still being processed. Please check back later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-block bg-[#7965C1] hover:bg-[#5d4fa8] text-white font-semibold py-2 px-6 rounded-md transition duration-200"
              >
                Check Again
              </button>
            </>
          )}
        </div>
      </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
