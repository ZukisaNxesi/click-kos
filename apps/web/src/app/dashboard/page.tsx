"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import {
  Package,
  Users,
  Clock,
  TrendingUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  MoreVertical,
  FileText,
  Printer,
  X,
  History,
  ShoppingCart,
  Receipt,
  RotateCcw,
  MessageSquare,
  Star,
  Plus,
  Search,
  BookOpen,
  DollarSign,
  Tag,
  ToggleLeft,
  ToggleRight,
  Image,
} from "lucide-react";
import {
  getAccessToken,
  getAuthStatus,
  getUserData,
  type UserData,
} from "../../lib/auth";
import { toast } from "sonner";

// Define interfaces for types
interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  status: "pending" | "completed" | "cancelled";
  time: string;
  notes?: string;
  feedback?: boolean;
  total_amount: number;
  eta?: string;
}

interface MenuItemImage {
  url: string;
}

interface MenuItem {
  item_id: string;
  name: string;
  price: number; // Stored as a number in the DB
  description: string;
  available: boolean;
  category: string;
  item_image?: MenuItemImage[];
}

interface OrderQueueProps {
  orders: Order[];
  completeOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
}

// Reusable Modal Component with fixed backdrop styling
const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-[#0E2148] dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
};

// --- New Staff Components ---

// Form for adding/updating a menu item
interface MenuItemFormProps {
  initialData?: MenuItem;
  onSubmit: (data: Partial<MenuItem> & { imageUrl?: string }) => void;
  isSubmitting: boolean;
  availableCategories: string[];
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  availableCategories,
}) => {
  const [formData, setFormData] = useState<
    Partial<MenuItem> & { imageUrl?: string; imageFile?: File }
  >(
    initialData
      ? {
          ...initialData,
          imageUrl: initialData.item_image?.[0]?.url || "",
          imageFile: undefined,
        }
      : {
          name: "",
          price: 0,
          description: "",
          available: true,
          category: "",
          imageUrl: "",
          imageFile: undefined,
        }
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, imageFile: e.target.files?.[0] }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? parseFloat(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleToggle = (name: keyof MenuItem) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="item_id" value={formData.item_id || ""} />
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name || ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-[#483AA0] focus:border-[#483AA0]"
        />
      </div>
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Price (R)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          required
          min="0"
          value={formData.price || 0}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-[#483AA0] focus:border-[#483AA0]"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          value={formData.description || ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-[#483AA0] focus:border-[#483AA0]"
        ></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full mt-1 p-2 border rounded-md dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select a category</option>
          <option value="Traditional">Traditional</option>
          <option value="Grill">Grill</option>
          <option value="Sandwhich">Sandwhich</option>
          <option value="Beverages">Beverages</option>
          <option value="Beverages">Other</option>
        </select>
      </div>
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <label
          htmlFor="available"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <Tag className="w-4 h-4 text-[#483AA0]" />
          Available for Order
        </label>
        <button
          type="button"
          onClick={() => handleToggle("available")}
          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#483AA0] ${
            formData.available ? "bg-green-600" : "bg-gray-200 dark:bg-gray-600"
          }`}
          role="switch"
          aria-checked={formData.available}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
              formData.available ? "translate-x-5" : "translate-x-0"
            }`}
          ></span>
        </button>
      </div>
      <div>
        <label
          htmlFor="image"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {" "}
          Image{" "}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#483AA0] file:text-white hover:file:bg-[#3d3184]"
        />
      </div>
      <div>
        <label
          htmlFor="imageUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Image URL (Optional)
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={formData.imageUrl || ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-[#483AA0] focus:border-[#483AA0]"
        />
      </div>
      <div className="flex justify-end pt-4 border-t dark:border-gray-700">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-full font-semibold text-white transition-colors ${
            isSubmitting
              ? "bg-[#483AA0]/60 cursor-not-allowed"
              : "bg-[#483AA0] hover:bg-[#3d3184]"
          }`}
        >
          {isSubmitting
            ? "Saving..."
            : initialData
            ? "Update Item"
            : "Add Item"}
        </button>
      </div>
    </form>
  );
};

// Method to fetch orders
const fetchOrders = async () => {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    //console.error('No access token found');
    return;
  }

  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${accessToken}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/order`,
      requestOptions
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const orders = await response.json();
    console.log(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

// Modal for updating a menu item
interface UpdateMenuItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onUpdate: (data: Partial<MenuItem> & { imageUrl?: string }) => void;
  isSubmitting: boolean;
  availableCategories?: string[];
}

const UpdateMenuItemModal: React.FC<UpdateMenuItemModalProps> = ({
  item,
  onClose,
  onUpdate,
  isSubmitting,
  availableCategories = [
    "Panini",
    "Decadent",
    "Sandwich",
    "Beverages",
    "Burgers",
    "Wraps",
    "Add-on",
  ],
}) => {
  const handleSubmit = (data: Partial<MenuItem> & { imageUrl?: string }) => {
    onUpdate(data);
  };

  return (
    <Modal title={`Update Menu Item: ${item.name}`} onClose={onClose}>
      <MenuItemForm
        initialData={item}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        availableCategories={availableCategories}
      />
    </Modal>
  );
};

// Modal for adding a new menu item
interface AddMenuItemModalProps {
  onClose: () => void;
  onAdd: (data: Partial<MenuItem> & { imageUrl?: string }) => void;
  isSubmitting: boolean;
  availableCategories?: string[];
}

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  onClose,
  onAdd,
  isSubmitting,
  availableCategories = [
    "Panini",
    "Decadent",
    "Sandwich",
    "Beverages",
    "Burgers",
    "Wraps",
    "Add-on",
  ],
}) => {
  const handleSubmit = (data: Partial<MenuItem> & { imageUrl?: string }) => {
    onAdd(data);
  };

  return (
    <Modal title="Add New Menu Item" onClose={onClose}>
      <MenuItemForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        availableCategories={[]}
      />
    </Modal>
  );
};

// Component for a single menu item
interface MenuItemCardProps {
  item: MenuItem;
  onUpdateClick: (item: MenuItem) => void;
  handleDelete: (itemId: string) => void;
  isSubmitting: boolean;
  deletingItemId: string | null;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onUpdateClick,
  handleDelete,
  isSubmitting,
  deletingItemId,
}) => {
  return (
    <div className="flex bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg">
      {/* Invisible Item ID for staff */}
      <span className="sr-only">Item ID: {item.item_id}</span>

      {/* Image Section */}
      <div className="w-24 h-24 flex-shrink-0">
        {item.item_image && item.item_image.length > 0 ? (
          <img
            src={item.item_image?.[0]?.url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Image className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-3 flex-grow flex flex-col justify-between">
        <h3 className="text-lg font-semibold text-[#0E2148] dark:text-white truncate">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">
          {item.description}
        </p>
        <div className="flex justify-between items-end mt-auto">
          <div className="flex flex-col">
            <span className="text-base font-bold text-green-600 dark:text-green-400">
              R{item.price.toFixed(2)}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                item.available
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {item.available ? "Available" : "Unavailable"}
            </span>
          </div>
          <button
            onClick={() => onUpdateClick(item)}
            className="px-3 py-1 text-sm rounded-full bg-[#483AA0] text-white hover:bg-[#3d3184] transition-colors shadow-md"
          >
            Update
          </button>

          <button
            onClick={() => handleDelete(item.item_id)}
            disabled={isSubmitting && deletingItemId === item.item_id}
            className={`px-3 py-1 text-sm rounded-full text-white ${
              deletingItemId === item.item_id
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {deletingItemId === item.item_id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Menu Management Component
const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const availableCategories = ["Traditional", "Grill", "Sandwich", "Beverages"];
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Mock API Call (Replace with actual fetch logic)

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!process.env.NEXT_PUBLIC_SERVER_URL) {
        throw new Error("NEXT_PUBLIC_SERVER_URL is not defined.");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/menu`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch menu items.");
      }
      const result = await response.json();
      console.log("API Response:", result);
      setMenuItems(result.data);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred while fetching menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Filtering Logic
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return menuItems;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerCaseSearch) ||
        item.description.toLowerCase().includes(lowerCaseSearch) ||
        item.category.toLowerCase().includes(lowerCaseSearch)
    );
  }, [menuItems, searchTerm]);

  // Handler for update modal
  const handleUpdateClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setDeletingItemId(itemId);
      setIsSubmitting(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/menu/${itemId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete item");
      }

      setSuccessMessage("Menu item deleted successfully!");
      fetchMenuItems();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      setError(error.message || "Failed to delete item");
    } finally {
      setIsSubmitting(false);
      setDeletingItemId(null);
    }
  };

  const handleUpdateSubmit = async (
    data: Partial<MenuItem> & { imageUrl?: string; imageFile?: File }
  ) => {
    if (!selectedItem) return;

    try {
      let imageUrl = data.imageUrl;
      if (data.imageFile) {
        const formData = new FormData();
        formData.append("file", data.imageFile);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/menu/${selectedItem.item_id}/images`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (!response.ok) {
          throw new Error("Failed to upload image");
        }
        const imageData = await response.json();
        imageUrl = imageData.url;
      }

      const updatedData = {
        name: data.name,
        price: data.price,
        description: data.description,
        available: data.available,
        category: data.category?.toLowerCase(),
        imageUrl,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/menu/${selectedItem.item_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update menu item");
      }

      setSuccessMessage("Menu item updated successfully!");
      fetchMenuItems();
      setSelectedItem(null);
    } catch (error: any) {
      setError(error.message || "Failed to update menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubmit = async (
    data: Partial<MenuItem> & { imageUrl?: string; imageFile?: File }
  ) => {
    try {
      // Create a new menu item without an image
      const newData = {
        name: data.name,
        price: data.price,
        description: data.description,
        available: data.available,
        category: data.category?.toLowerCase(),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/menu`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add menu item");
      }

      const menuItemData = await response.json();
      const menuItemId = menuItemData.data.item_id;

      // Upload the image
      if (data.imageFile) {
        const formData = new FormData();
        formData.append("file", data.imageFile, data.imageFile.name); // Add the file name
        const imageResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/menu/${menuItemId}/images`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          throw new Error(errorData.error || "Failed to upload image");
        }
      }

      setSuccessMessage("Menu item added successfully!");
      fetchMenuItems();
      setIsAddModalOpen(false);
    } catch (error: any) {
      setError(error.message || "Failed to add menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-[#0E2148] dark:text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-[#483AA0]" />
        Menu Management
      </h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Box */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#483AA0]"
          />
        </div>

        {/* Add New Item Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 rounded-lg bg-[#483AA0] text-white font-semibold hover:bg-[#3d3184] transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Item
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 mb-4 bg-red-100 dark:bg-red-900 border border-red-400 rounded text-red-800 dark:text-red-200 flex items-center">
          <XCircle className="w-5 h-5 mr-2" /> {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 mb-4 bg-green-100 dark:bg-green-900 border border-green-400 rounded text-green-800 dark:text-green-200 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2" /> {successMessage}
        </div>
      )}

      {/* Menu Item List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <RotateCcw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#483AA0]" />
          <p>Loading menu items...</p>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No menu items found matching "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => (
            <MenuItemCard
              key={item.item_id}
              item={item}
              onUpdateClick={handleUpdateClick}
              handleDelete={handleDelete}
              isSubmitting={isSubmitting}
              deletingItemId={deletingItemId}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <UpdateMenuItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdateSubmit}
          isSubmitting={isSubmitting}
          availableCategories={availableCategories}
        />
      )}
      {isAddModalOpen && (
        <AddMenuItemModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddSubmit}
          isSubmitting={isSubmitting}
          availableCategories={availableCategories}
        />
      )}
    </div>
  );
};

// The main StaffDashboard component - updated to include MenuManagement
const DashboardSection: React.FC<{
  title: string;
  icon: ReactNode;
  children: ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-xl font-semibold text-[#0E2148] dark:text-white mb-4 flex items-center gap-2">
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

const StaffDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  });

  // --- Start of new/reintroduced logic ---
  const completeOrder = async (orderId: string) => {
    const token = getAccessToken();
    if (!token) {
      setError("Not authenticated");
      return;
    }
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${orderId}?status=completed`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const res = await req.json();
    if (res.error) {
      toast("Failed to complete order: " + orderId);
    } else {
      toast("Successfully completed order: " + orderId);
    }
    // TODO: Add API call to update order status on the server

    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: "completed" } : order
      )
    );
  };

  const cancelOrder = async (orderId: string) => {
    const token = getAccessToken();
    if (!token) {
      setError("Not authenticated");
      return;
    }
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${orderId}?status=cancelled`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const res = await req.json();
    if (res.error) {
      toast("Failed to cancel order: " + orderId);
    } else {
      toast("Successfully cancelled order: " + orderId);
    }
    // TODO: Add API call to update order status on the server
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: "cancelled" } : order
      )
    );
  };

  const fetchOrders = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/order`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store", // Add cache: 'no-store' for fresh data
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to load orders");
        setOrders([]);
        return;
      }

      // Logic for 'staff'/'admin' role
      const serverOrders = data?.orders ?? [];

      const mappedOrders: Order[] = serverOrders.map((o: any) => {
        // Map server's nested order_item array to the client's OrderItem interface
        const items: OrderItem[] = (o.order_item ?? []).map((i: any) => ({
          name: i.name ?? i?.menu_item?.name ?? `Item ${i.menu_item_id}`,
          quantity: i.quantity,
          // Calculate price per item from subtotal
          price: i.subtotal / Math.max(1, i.quantity),
        }));

        // Calculate total amount from the sum of subtotals
        const total_amount = (o.order_item ?? []).reduce(
          (sum: number, i: any) => sum + (i.subtotal ?? 0),
          0
        );

        return {
          id: o.order_id || o.id, // Use order_id from original code, but check for generic 'id'
          customer: `${o.user_id}` || o.user_id,
          items,
          total_amount,
          status: o.status ?? "pending", // Default to 'pending'
          time: (o.ordered_at ?? o.created_at)?.split?.("T")?.[0] ?? "",
          notes: o.notes ?? undefined,
          feedback: o.feedback ?? undefined,
        } as Order;
      });

      setOrders(mappedOrders);
    } catch (e: any) {
      console.error("Error fetching orders:", e);
      setError(e?.message || "Unexpected error");
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0E2148] dark:text-white mb-6">
        Staff Dashboard
      </h1>
      {error && (
        <div className="p-3 mb-4 bg-red-100 dark:bg-red-900 border border-red-400 rounded text-red-800 dark:text-red-200 flex items-center">
          <XCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <OrderQueue
            orders={orders}
            completeOrder={completeOrder}
            cancelOrder={cancelOrder}
          />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <MenuManagement />
        </div>
      </div>
    </div>
  );
};

// OrderQueue component to display and manage a list of orders.
const OrderQueue: React.FC<OrderQueueProps> = ({
  orders,
  completeOrder,
  cancelOrder,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const toggleMenu = (orderId: string) => {
    setOpenMenuId(openMenuId === orderId ? null : orderId);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const handlePrintReceipt = (orderId: string) => {
    console.log(`Printing receipt for order: ${orderId}`);
    setOpenMenuId(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-[#0E2148] dark:text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-[#483AA0]" />
        Order Queue
        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
          ({orders.filter((o) => o.status.toLowerCase() === "pending").length}{" "}
          pending)
        </span>
      </h2>

      <div className="space-y-4">
        {orders.length === 0 ? (
          // Display this message when the orders array is empty
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No new orders at the moment.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                    {order.id}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({order.time})
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => toggleMenu(order.id)}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openMenuId === order.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      >
                        <FileText className="w-4 h-4 mr-2" /> View Details
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(order.id)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      >
                        <Printer className="w-4 h-4 mr-2" /> Print Receipt
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Customer: {order.customer}
              </p>

              <div className="mt-2 space-y-1">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200"
                  >
                    <span>{item.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : order.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {order.status}
                </span>

                {order.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => completeOrder(order.id)}
                      className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                      aria-label={`Mark order ${order.id} as complete`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      aria-label={`Cancel order ${order.id}`}
                    >
                                            <XCircle className="w-4 h-4" />     
                                   {" "}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <Modal
          title={`Order Details: ${selectedOrder.id}`}
          onClose={closeModal}
        >
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p className="text-lg font-medium">
              Customer: {selectedOrder.customer}
            </p>
            <div>
              <h4 className="text-md font-semibold mb-2">Items:</h4>
              <ul className="list-disc list-inside space-y-1">
                {selectedOrder.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      {item.quantity} x {item.name}
                    </span>
                    <span>R{(item.quantity * item.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>
                    R
                    {selectedOrder.items
                      .reduce(
                        (acc, item) => acc + item.quantity * item.price,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {selectedOrder.notes && (
              <div>
                <h4 className="text-md font-semibold mb-1">Notes:</h4>
                <p className="italic text-sm">{selectedOrder.notes}</p>
              </div>
            )}
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Placed: {selectedOrder.time}</p>
              <p>
                Status:{" "}
                <span className="font-semibold">{selectedOrder.status}</span>
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// FeedbackModal component for students to leave feedback
interface FeedbackModalProps {
  order: Order;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  order,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Add your logic here to handle the form submission
    // For example, you can call the onSubmit prop and pass the rating and comment
    onSubmit(rating, comment);
  };

  return (
    <Modal title={`Leave Feedback for Order ${order.id}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Rate your experience:
          </h4>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                className={`cursor-pointer transition-colors ${
                  rating >= star
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300 dark:text-gray-600"
                }`}
                onClick={() => handleRatingChange(star)}
              />
            ))}
          </div>
        </div>
        <div>
          <label
            htmlFor="comment"
            className="block font-semibold mb-2 text-gray-700 dark:text-gray-300"
          >
            Comments:
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#483AA0]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-[#483AA0] text-white hover:bg-[#3d3184] transition-colors"
          >
            Submit Feedback
          </button>
        </div>
      </form>
    </Modal>
  );
};

// The Student Dashboard component
const StudentDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null); // Add error state

  const fetchOrders = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/order`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to load your orders");
        setOrders([]);
        return;
      }

      // Student API returns { currentOrders: [], pastOrders: [] }
      const { currentOrders: current, pastOrders: past } = data;

      // Combine the two arrays
      const rawOrders = [...(current ?? []), ...(past ?? [])];

      const mappedOrders: Order[] = rawOrders.map((o: any) => {
        const simplifiedItem: OrderItem = {
          name: o.item || "Multiple Items", // The server returns a joined string of items
          quantity: 1,
          price: o.price, // The server returns the total price in this field
        };

        return {
          id: o.id,
          customer: "You",
          // This is a necessary simplification based on the current user API response format
          items: [simplifiedItem],
          total_amount: o.price,
          status: o.status ?? "pending",
          time: o.date?.split?.("T")?.[0] ?? "",
          // The current user API response does NOT include notes or feedback status,

          notes: undefined,
          feedback: false,
        } as Order;
      });

      setOrders(mappedOrders);
    } catch (e: any) {
      console.error("Error fetching student orders:", e);
      setError(e?.message || "Unexpected error fetching orders");
      setOrders([]);
    }
  };

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [orderToFeedback, setOrderToFeedback] = useState<Order | null>(null);

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleFeedbackClick = (order: Order) => {
    setOrderToFeedback(order);
    setFeedbackModalOpen(true);
  };

  const submitFeedback = (rating: number, comment: string) => {
    console.log(
      `Submitting feedback for order ${orderToFeedback?.id}: Rating ${rating}, Comment: ${comment}`
    );
    if (!orderToFeedback) return;
    setOrders(
      orders.map((o) =>
        o.id === orderToFeedback.id ? { ...o, feedback: true } : o
      )
    );
    setFeedbackModalOpen(false);
    setOrderToFeedback(null);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0E2148] dark:text-white mb-6">
        Student Dashboard
      </h1>
      {error && ( // New Error Display Block
        <div className="p-3 mb-4 bg-red-100 dark:bg-red-900 border border-red-400 rounded text-red-800 dark:text-red-200 flex items-center">
          <XCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-[#0E2148] dark:text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#483AA0]" />
              Start New Order
            </h2>
            <button
              onClick={() => (window.location.href = "/menu")}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#483AA0] transition-colors text-center"
            >
              <span className="text-lg text-gray-600 dark:text-gray-400">
                Go to Menu
              </span>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#0E2148] to-[#483AA0] text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">pending Orders</p>
                <p className="text-2xl font-bold">
                  {
                    orders.filter((o) => o.status.toLowerCase() === "pending")
                      .length
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 opacity-75" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#483AA0] to-[#7965C1] text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <History className="w-8 h-8 opacity-75" />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-[#0E2148] dark:text-white mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#483AA0]" />
          Order History
        </h2>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>You have not placed any orders yet.</p>
            </div>
          ) : (
            orders
              .sort(
                (a, b) =>
                  new Date(b.time).getTime() - new Date(a.time).getTime()
              )
              .map((order, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm"
                >
                  {/* order details */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                        #{index + 1}{" "}
                        {/* Use index + 1 to display a order number */}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({order.time})
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {order.items.map((item) => item.name).join(", ")}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 animate-pulse"
                          : order.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {order.status}
                    </span>
                    {order.status === "completed" && !order.feedback && (
                      <button
                        onClick={() => handleFeedbackClick(order)}
                        className="flex items-center gap-1 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">
                          Leave Feedback
                        </span>
                      </button>
                    )}
                    {order.status === "completed" && order.feedback && (
                      <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" /> Feedback Submitted
                      </span>
                    )}
                    {order.status === "pending" && (
                      <button
                        onClick={() => {}}
                        className="flex items-center gap-1 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Refresh status"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-xs hidden md:inline">
                          Refresh
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      {selectedOrder && (
        <Modal
          title={`Order Details: ${selectedOrder.id}`}
          onClose={closeModal}
        >
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p className="text-lg font-medium">
              Customer: {selectedOrder.customer}
            </p>
            <div>
              <h4 className="text-md font-semibold mb-2">Items:</h4>
              <ul className="list-disc list-inside space-y-1">
                {selectedOrder.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      {item.quantity} x {item.name}
                    </span>
                    <span>R{(item.quantity * item.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>
                    R
                    {selectedOrder.items
                      .reduce(
                        (acc, item) => acc + item.quantity * item.price,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Placed: {selectedOrder.time}</p>
              <p>
                Status:{" "}
                <span className="font-semibold capitalize">
                  {selectedOrder.status}
                </span>
              </p>
            </div>
          </div>
        </Modal>
      )}
      {feedbackModalOpen && orderToFeedback && (
        <FeedbackModal
          order={orderToFeedback}
          onClose={() => setFeedbackModalOpen(false)}
          onSubmit={submitFeedback}
        />
      )}
    </div>
  );
};

const LoginForm = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Access Required</h2>
        <p className="text-lg font-medium mb-6">Login to view dashboard</p>
      </div>
    </div>
  );
};

// The main component that switches between dashboards.
export default function DashboardSwitcher() {
  const [activeDashboard, setActiveDashboard] = useState<
    "staff" | "student" | null
  >(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const isLoggedIn = getAuthStatus();
      const userData = getUserData();
      console.log(userData);
      setIsLoggedIn(isLoggedIn);
      setUserData(userData);
      if (isLoggedIn && userData) {
        if (userData.role === "admin" || userData.role === "staff") {
          setActiveDashboard("staff");
        } else if (userData.role === "student") {
          setActiveDashboard("student");
        } else {
          console.error("Unexpected user role:", userData.role);
        }
      }
    };
    checkAuthStatus();
  }, []);

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return (
    <div className="container mx-auto max-w-full lg:max-w-screen-lg xl:max-w-screen-xl px-4 py-6">
      {activeDashboard === "staff" ? <StaffDashboard /> : <StudentDashboard />}
    </div>
  );
}
