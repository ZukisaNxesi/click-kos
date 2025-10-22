"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, Menu, User, X } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import NotificationDropdown from "./NotificationsDropdown";
import {
  getAuthStatus,
  getUserData,
  clearAuth,
  type UserData,
  isAuthenticated,
} from "../lib/auth";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Type definitions
type TabId =
  | "overview"
  | "orders"
  | "menu"
  | "analytics"
  | "dashboard"
  | "admin";

interface Tab {
  id: TabId;
  label: string;
  href: string;
  target: string[];
}

const tabs: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/",
    target: ["student", "public"],
  },
  { id: "menu", label: "Menu", href: "/menu", target: ["student", "public"] },
  { id: "orders", label: "Orders", href: "/orders", target: ["student"] },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    target: ["student", "staff"],
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    target: ["admin"],
  },
  { id: "admin", label: "Admin", href: "/admin", target: ["admin"] },
];

// Default user data
const defaultUser: UserData = {
  name: "Thuso Ndou",
  email: "37853058@mynwu.ac.za",
  role: "Student",
};

export default function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check authentication status and user data on component mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = getAuthStatus();
      const user = getUserData();

      if (authStatus && user) {
        setIsLoggedIn(true);
        setUserData(user);
      } else {
        setIsLoggedIn(false);
        setUserData(defaultUser);
      }

      const authenticated = isAuthenticated();
      const userData = getUserData();
      setIsLoggedIn(authenticated);
      setUserData(userData);
    };

    // Check immediately
    checkAuthStatus();

    // Listen for storage changes (when login/logout happens in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "isAuthenticated" ||
        e.key === "user" ||
        e.key === "access_token"
      ) {
        checkAuthStatus();
      }
    };

    // Listen for custom events (when login/logout happens in same tab)
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  const isActiveTab = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    // Clear authentication data using the utility function
    clearAuth(localStorage);
    toast("Successfully signed out...");

    // Navigate to login page
    router.replace("/auth/login");
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };
  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-50">
      <div className="flex flex-row items-center justify-between px-4 py-3">
        {/* Logo/Brand Area */}
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <Button
            onClick={toggleMobileNav}
            variant="ghost"
            size="sm"
            className="lg:hidden"
          >
            <Menu />
          </Button>
          <Link
            href="/"
            className="text-lg font-bold text-[#0E2148] dark:text-white flex gap-2 items-center"
          >
            <Image
              src="/logo.png"
              alt="Click & Kos Logo"
              width={40}
              height={40}
              className="rounded-xl"
            />
            Click & Kos
          </Link>
        </div>

        {/* Right Side - Navigation Tabs, Auth, and Mode Toggle */}
        <div className="flex items-center gap-4">
          {/* Navigation Tabs */}

          {/* Overlay For Mobile Nav*/}
          {mobileNavOpen && (
            <div
              id="overlay"
              onClick={toggleMobileNav}
              className="fixed lg:hidden top-0 left-0 w-full h-full bg-black/50 z-10"
            ></div>
          )}

          <nav
            className={`${
              mobileNavOpen ? "flex" : "hidden"
            } lg:flex flex-col lg:w-fit w-72 z-50 top-0 h-screen lg:h-fit right-0 left-0 absolute lg:relative lg:flex-row space-x-1 bg-white dark:bg-gray-800 lg:bg-gray-100 dark:lg:bg-gray-800 p-4 lg:p-1 lg:rounded-lg border lg:border-0 border-gray-200 dark:border-gray-700`}
          >
            {mobileNavOpen && (
              <div className="flex justify-between items-center lg:hidden mb-4">
                {/* Mobile Menu Header */}
                <h2 className="text-lg font-bold text-[#0E2148] dark:text-white">
                  Navigation
                </h2>
                <Button
                  variant="ghost"
                  className="text-[#0E2148] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  size="sm"
                  onClick={toggleMobileNav}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
            {tabs.map((tab) =>
              tab.target.includes(userData?.role.toLowerCase() || "") ? (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`px-4 py-3 lg:py-2 rounded-lg lg:rounded-md text-sm lg:text-sm font-medium transition-colors mb-2 lg:mb-0 ${
                    isActiveTab(tab.href)
                      ? "bg-[#483AA0] text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 lg:text-gray-600 dark:lg:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hover:text-[#483AA0] dark:lg:hover:text-[#7965C1]"
                  }`}
                >
                  {tab.label}
                </Link>
              ) : tab.target.includes("public") ? (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`px-4 py-3 lg:py-2 rounded-lg lg:rounded-md text-sm lg:text-sm font-medium transition-colors mb-2 lg:mb-0 ${
                    isActiveTab(tab.href)
                      ? "bg-[#483AA0] text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 lg:text-gray-600 dark:lg:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hover:text-[#483AA0] dark:lg:hover:text-[#7965C1]"
                  }`}
                >
                  {tab.label}
                </Link>
              ) : (
                ""
              )
            )}

            {/* Mobile Notifications */}
            {mobileNavOpen && (
              <div className="flex flex-col gap-3 mt-4">
                <NotificationDropdown />
              </div>
            )}

            {/* Mobile Auth Section */}
            {mobileNavOpen && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 lg:hidden">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0E2148] to-[#483AA0] flex items-center justify-center text-white">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {userData?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {userData?.email}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Menu Items */}
                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setMobileNavOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileNavOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm rounded-lg bg-[#0E2148] text-white hover:bg-[#483AA0] transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
              </div>
            )}
          </nav>

          {/* Desktop Profile & Settings Group */}
          <div className="hidden lg:flex items-center gap-2">
            <NotificationDropdown />
            {/* Auth/Profile Section */}
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#483AA0] focus:ring-offset-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0E2148] to-[#483AA0] flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                    <User className="w-4 h-4" />
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0E2148] to-[#483AA0] flex items-center justify-center text-white overflow-hidden">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {userData?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {userData?.email}
                          </p>
                          <p className="text-xs text-[#483AA0] dark:text-[#7965C1]">
                            {userData?.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-[#0E2148] text-white hover:bg-[#483AA0] focus:outline-none focus:ring-2 focus:ring-[#483AA0] focus:ring-offset-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {/* Mode Toggle */}
            <ModeToggle />
          </div>
        </div>
      </div>
      <hr className="border-gray-200 dark:border-gray-700" />
    </div>
  );
}
