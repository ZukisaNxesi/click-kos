"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    department: "",
    year: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
    if (field === "password") checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return "bg-red-500";
    if (passwordStrength < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 50) return "Weak";
    if (passwordStrength < 75) return "Medium";
    return "Strong";
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName)
      return "Please enter your full name";
    if (!formData.email || !formData.email.includes("@"))
      return "Please enter a valid email address";
    if (
      !formData.email.endsWith("@mynwu.ac.za") ||
      !formData.email.endsWith("@nwu.ac.za")
    )
      return "Please use your university email (@mynwu.ac.za)";
    if (!formData.studentId) return "Please enter your student ID";
    if (formData.role === "student" && formData.studentId.length !== 8)
      return "Student ID must be exactly 8 digits";
    if (formData.password.length < 8)
      return "Password must be at least 8 characters long";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    if (!formData.department) return "Please select your department";
    if (!formData.year) return "Please select your year of study or position";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      // Map form data to API expected format
      const apiData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        student_number: formData.studentId, // API expects student_number
        faculty: formData.department, // API expects faculty
        year_of_study: parseInt(formData.year), // Convert to number for API
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 3000);
      } else {
        setError(
          data.error ||
            "An error occurred during registration. Please try again."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const departments = [
    "Computer Science",
    "Engineering",
    "Business Studies",
    "Arts & Humanities",
    "Natural Sciences",
    "Social Sciences",
    "Medicine",
    "Law",
  ];

  const years = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "Postgraduate",
    "PhD",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-8 px-2 sm:px-6 lg:px-12">
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="mt-8 text-center text-3xl font-bold text-[#0E2148] dark:text-white">
          Create your account
        </h2>
        <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
          Join Click & Kos and start ordering your favorite meals
        </p>
      </div>

      <div className="mt-6 mx-auto w-full max-w-4xl bg-white dark:bg-gray-800 py-6 px-4 sm:px-6 lg:px-8 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            </div>
          )}

          {showSuccess && (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Registration Successful!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Please check your email to verify your account. You will be
                  redirected to login in a few seconds.
                </p>
              </div>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Name"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Surname"
                required
              />
            </div>
          </div>

          {/* Email & ID Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                University Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="@mynwu.ac.za"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="studentId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {formData.role === "student" ? "Student ID" : "Staff ID"}
              </label>
              <input
                id="studentId"
                type="text"
                value={formData.studentId}
                onChange={(e) =>
                  handleInputChange(
                    "studentId",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={
                  formData.role === "student" ? "20240012" : "STAFF001"
                }
                required
                maxLength={8}
                pattern={formData.role === "student" ? "\\d{8}" : undefined}
                title={
                  formData.role === "student"
                    ? "Student ID must be exactly 8 digits"
                    : undefined
                }
              />
            </div>
          </div>

          {/* Department & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Department
              </label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select...</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {formData.role === "student" ? "Year of Study" : "Position"}
              </label>
              <select
                id="year"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select...</option>
                {formData.role === "student"
                  ? years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
                  : [
                      "Lecturer",
                      "Professor",
                      "Administrator",
                      "Support Staff",
                    ].map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Password & Confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full pl-8 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-1">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Password strength:
                    </span>
                    <span
                      className={`font-medium ${
                        passwordStrength < 50
                          ? "text-red-600"
                          : passwordStrength < 75
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="w-full pl-8 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#483AA0] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="mt-1 flex items-center gap-1">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        Passwords do not match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-[#483AA0] focus:ring-[#483AA0] border-gray-300 rounded mt-1"
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-[#483AA0] dark:text-[#7965C1] hover:text-[#0E2148] dark:hover:text-[#483AA0] font-medium"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-[#483AA0] dark:text-[#7965C1] hover:text-[#0E2148] dark:hover:text-[#483AA0] font-medium"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#483AA0] hover:bg-[#7965C1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#483AA0] disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>

          {/* Already have an account */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#483AA0] dark:text-[#7965C1] hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
