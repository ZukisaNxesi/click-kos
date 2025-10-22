"use client";

import React, { useEffect } from "react";

function PaymentCancelPage() {
  const deleteOrder = async (order_id: string) => {
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${order_id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
  };
  useEffect(() => {
    const url = new URL(window.location.href);
    let order_id = url.searchParams.get("order_id");
    if (order_id) {
      url.searchParams.delete("order_id");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      deleteOrder(order_id);
    }
  });
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You can continue shopping and checkout again when ready.
        </p>
        <div className="space-y-3">
          <a
            href="/"
            className="block text-gray-600 hover:text-gray-800 font-medium"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
