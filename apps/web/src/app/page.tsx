"use client";

"react";
import {
  Search,
  ShoppingCart,
  Star,
  Clock,
  TrendingUp,
  ChefHat,
  Heart,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { toCartItem } from "@/lib/cart";
import { processCheckout } from "@/lib/checkout";

const categories = [
  { id: "all", name: "All Items", icon: ChefHat },
  { id: "panini", name: "Pita & Panini", icon: Star },
  { id: "decadent", name: "Decadent treats", icon: TrendingUp },
  { id: "sandwich", name: "Sandwiches", icon: ChefHat },
  { id: "beverages", name: "Beverages", icon: Star },
  { id: "burgers", name: "Burgers", icon: Star },
  { id: "wraps", name: "Wraps", icon: Star },
  { id: "add-on", name: "Add-on", icon: Star },
];

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showCartPopup, setShowCartPopup] = useState(false);

  // Auto-open cart popup if ?checkout=1 is present
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("checkout") === "1") {
        setShowCartPopup(true);
        url.searchParams.delete("checkout");
        window.history.replaceState(
          {},
          "",
          url.pathname + url.search + url.hash
        );
      }
    } catch {}
  }, []);

  // Fetch menu items
  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== "all")
          params.append("category", selectedCategory);
        if (searchTerm.trim() !== "")
          params.append("keyword", searchTerm.trim());

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/menu?${params.toString()}`
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const resData = await res.json();
        setFeaturedItems(resData.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load menu. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [selectedCategory, searchTerm]);

  const toggleFavorite = (itemId: number) => {
    setFavorites((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const {
    addToCart,
    cartCount,
    cartItems: cartContextItems,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleCheckout = async () => {
    await processCheckout({
      cartItems: cartContextItems,
      clearCart,
    });
  };

  const filteredItems = featuredItems;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0E2148] via-[#483AA0] to-[#7965C1] rounded-2xl p-8 mb-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Welcome to Click & Kos</h1>
          <p className="text-lg text-blue-100 mb-6">
            Discover authentic South African flavors and campus favorites. Order
            ahead to skip the queue during peak hours.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Open: 07:00 - 17:00</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Average wait: 8 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">Filters</span>
          </button>
          <button
            onClick={() => setShowCartPopup(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#7965C1] text-white rounded-xl hover:bg-[#483AA0] transition-colors shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart ({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-[#483AA0] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-[#0E2148] dark:text-white">
            {featuredItems.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Items Available
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-[#483AA0] dark:text-[#7965C1]">
            4.7
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Rating
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-[#7965C1] dark:text-[#483AA0]">
            8min
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Wait
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">89%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Satisfaction
          </div>
        </div>
      </div>

      {/* Featured Items Grid */}
      <div className="featured-items">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0E2148] dark:text-white">
            {selectedCategory === "all"
              ? "Featured Items"
              : `${
                  categories.find((c) => c.id === selectedCategory)?.name
                } Items`}
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredItems.length} items found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
              Loading menu...
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-16 text-red-500">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
              No items found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.item_id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Item Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.item_image?.[0]?.url}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => toggleFavorite(item.item_id)}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                      favorites.includes(item.item_id)
                        ? "bg-red-100 text-red-600"
                        : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-600"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(item.item_id) ? "fill-current" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[#0E2148] dark:text-white text-lg">
                      {item.name}
                    </h3>
                    <span className="text-lg font-bold text-[#483AA0] dark:text-[#7965C1]">
                      R{item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Add to Cart Button */}

                  <button
                    onClick={() => addToCart(toCartItem(item))}
                    className="w-full bg-gradient-to-r from-[#483AA0] to-[#7965C1] text-white py-2 px-4 rounded-lg hover:from-[#0E2148] hover:to-[#483AA0] transition-all duration-300 font-medium"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Daily Specials */}
      <div className="mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#0E2148] dark:text-white mb-2">
            Today's Specials
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Limited time offers you don't want to miss
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-[#0E2148] dark:text-white">
                Student Special
              </h3>
              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                20% Off
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Any main meal + drink combo for students with valid ID
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-[#483AA0]">From R38</span>
              <button className="bg-[#483AA0] text-white px-4 py-2 rounded-lg hover:bg-[#0E2148] transition-colors text-sm">
                View Items
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-[#0E2148] dark:text-white">
                Happy Hour
              </h3>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                3-5 PM
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Buy 2 beverages and get the third one free
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-[#483AA0]">
                Buy 2 Get 1
              </span>
              <button className="bg-[#483AA0] text-white px-4 py-2 rounded-lg hover:bg-[#0E2148] transition-colors text-sm">
                Order Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Popup */}
      {showCartPopup && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowCartPopup(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-[#0E2148] dark:text-white">
                  Your Cart
                </h2>
                <button
                  onClick={() => setShowCartPopup(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Cart Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {cartContextItems.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    🛒 Your cart is empty.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cartContextItems.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-700"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-[#0E2148] dark:text-white">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            R{item.price}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartContextItems.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-[#0E2148] dark:text-white">
                      Total:
                    </span>
                    <span className="font-bold text-[#483AA0]">
                      R
                      {cartContextItems
                        .reduce((sum, item) => sum + item.price, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#7965C1] hover:bg-[#5d4fa8] text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                  >
                    Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
