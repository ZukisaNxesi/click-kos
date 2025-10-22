"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  Clock,
  Heart,
  ChefHat,
  TrendingUp,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { processCheckout } from "@/lib/checkout";
import { toCartItem } from "@/lib/cart";
import { toast } from "sonner";

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

export default function MenuPage() {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartItemsLocal, setCartItemsLocal] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);

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
          `${process.env.NEXT_PUBLIC_SERVER_URL}/menu?available=true&` +
            params.toString()
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
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };
  const handleAddToCartFromModal = () => {
    if (selectedItem) {
      addToCart(toCartItem(selectedItem));
      setShowItemModal(false);
    }
  };

  const { addToCart, cartCount, cartItems, removeFromCart, clearCart } =
    useCart();

  const handleCheckout = async () => {
    setShowCartPopup(false);
    await processCheckout({
      cartItems,
      clearCart,
      onSuccess: () => setShowCartPopup(false),
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0E2148] dark:text-white">
          Menu
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-[#483AA0] focus:border-transparent 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#483AA0] text-white rounded-lg hover:bg-[#0E2148] transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => setShowCartPopup(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7965C1] text-white rounded-lg hover:bg-[#483AA0] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({cartCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-semibold mb-4 text-[#0E2148] dark:text-white">
              Categories
            </h2>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-[#483AA0] text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              Loading menu...
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">{error}</div>
          ) : featuredItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              No menu items match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <div
                  key={item.item_id}
                  onClick={() => handleItemClick(item)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.item_image?.[0]?.url}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
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

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-[#0E2148] dark:text-white text-lg">
                        {item.name}
                      </h3>
                      <span className="text-lg font-bold text-[#483AA0]">
                        R{item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(toCartItem(item));
                      }}
                      className="w-full bg-gradient-to-r from-[#483AA0] to-[#7965C1] text-white py-2 px-4 rounded-lg hover:from-[#0E2148] hover:to-[#483AA0] transition-all duration-300 font-medium"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowItemModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-[#0E2148] dark:text-white">
                  {selectedItem.name}
                </h2>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="md:w-1/2">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-full h-64 md:h-80 object-cover rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div className="md:w-1/2">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-[#0E2148] dark:text-white mb-2">
                        {selectedItem.name}
                      </h3>
                      <p className="text-lg font-bold text-[#483AA0] mb-4">
                        R{selectedItem.price.toFixed(2)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {selectedItem.description}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {selectedItem.rating} Rating
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#483AA0]" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Cook Time: {selectedItem.cookTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-[#483AA0]" />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          Category: {selectedItem.category}
                        </span>
                      </div>
                      {selectedItem.isPopular && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Popular Item
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleAddToCartFromModal}
                        className="flex-1 bg-gradient-to-r from-[#483AA0] to-[#7965C1] text-white py-3 px-6 rounded-lg hover:from-[#0E2148] hover:to-[#483AA0] transition-all duration-300 font-medium"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => toggleFavorite(selectedItem.id)}
                        className={`p-3 rounded-lg transition-colors ${
                          favorites.includes(selectedItem.id)
                            ? "bg-red-100 text-red-600 border border-red-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(selectedItem.id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
                {cartItems.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    🛒 Your cart is empty.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item, index) => (
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
              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-[#0E2148] dark:text-white">
                      Total:
                    </span>
                    <span className="font-bold text-[#483AA0]">
                      R
                      {cartItems
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
