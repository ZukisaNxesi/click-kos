"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  AlertCircle,
} from "lucide-react";
import { getAccessToken } from "../../lib/auth";
import { toast } from "sonner";

interface UserProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_image_url?: string;
  student?: {
    student_number: string;
    faculty: string;
    year_of_study: number;
  };
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get the token from localStorage or wherever it's stored
        const token = getAccessToken();
        if (!token) {
          setError("No authentication token found");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        const user = data.user;
        setUserData(user);
        setEditedData(user);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, []);

  const getOrdinalSuffix = (num: number): string => {
    if (num === 5) return " (Postgraduate)";
    if (num === 6) return " (PhD)";
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original data
      setEditedData(userData || {});
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!editedData.student || !userData) return;

    try {
      toast("Loading...", {
        dismissible: true,
        richColors: true,
        description: "Saving your info",
      });
      const token = getAccessToken();
      if (!token) {
        setError("No authentication token found");
        return;
      }

      // Update student data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            faculty: editedData.student.faculty,
            year_of_study: editedData.student.year_of_study,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update local state
      const updatedUser = {
        ...userData,
        student: {
          ...userData.student!,
          faculty: editedData.student.faculty,
          year_of_study: editedData.student.year_of_study,
        },
      };
      setUserData(updatedUser);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field === "faculty" || field === "year_of_study") {
      setEditedData((prev) => ({
        ...prev,
        student: {
          ...prev.student!,
          [field]: value,
        },
      }));
    }
  };

  //Image upload
  const [newImage, setNewImage] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleSubmitImage = async (e: any) => {
    e.preventDefault();

    if (!newImage) {
      alert("Please select a file first");
      return;
    }
    setIsEditing(false);

    try {
      const token = getAccessToken();
      if (!token) {
        setError("No authentication token found");
        return;
      }
      toast("Loading...", {
        dismissible: true,
        richColors: true,
        description: "Uploading your image",
      });
      // Update student data
      const formData = new FormData();
      formData.append("file", newImage);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/profile`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#483AA0]"></div>
            <span className="ml-2">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center text-gray-500">
            No profile data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-[#0E2148] to-[#483AA0] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg overflow-hidden">
                  {userData.profile_image_url ? (
                    <img
                      src={userData.profile_image_url}
                      alt={`${userData.first_name} ${userData.last_name}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="text-white">
                <h1 className="text-2xl font-bold mb-2">
                  {userData.first_name} {userData.last_name}
                </h1>
                <p className="text-blue-100 mb-1">
                  {userData.role} • {userData.student?.faculty || "N/A"}
                </p>
                <p className="text-blue-200 text-sm">
                  Student ID: {userData.student?.student_number || "N/A"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="space-y-6">
            {isEditing && (
              <div>
                <h2 className="text-lg font-semibold text-[#0E2148] dark:text-white mb-4">
                  Upload new image
                </h2>
                <form
                  onSubmit={handleSubmitImage}
                  className="flex flex-col lg:flex-row gap-2 items-center"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit
                  </button>
                </form>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-[#0E2148] dark:text-white mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {userData.first_name} {userData.last_name}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {userData.email}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Student ID
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white">
                      {userData.student?.student_number || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h2 className="text-lg font-semibold text-[#0E2148] dark:text-white mb-4">
                Academic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  {isEditing ? (
                    <select
                      value={editedData.student?.faculty || ""}
                      onChange={(e) =>
                        handleInputChange("faculty", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business Studies">Business Studies</option>
                      <option value="Arts & Humanities">
                        Arts & Humanities
                      </option>
                      <option value="Health Sciences">Health Sciences</option>
                      <option value="Education">Education</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-900 dark:text-white">
                        {userData.student?.faculty || "N/A"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year of Study
                  </label>
                  {isEditing ? (
                    <select
                      value={editedData.student?.year_of_study || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "year_of_study",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">Postgraduate</option>
                      <option value="6">PhD</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-900 dark:text-white">
                        {userData.student?.year_of_study
                          ? userData.student.year_of_study === 5
                            ? "Postgraduate"
                            : userData.student.year_of_study === 6
                            ? "PhD"
                            : `${
                                userData.student.year_of_study
                              }${getOrdinalSuffix(
                                userData.student.year_of_study
                              )} Year`
                          : "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
