import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Building2 } from "lucide-react";
import { UserRole } from "../../types";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: any) => Promise<boolean>;
  onModeChange: () => void;
  loading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onModeChange,
  loading,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "donor" as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register" && !formData.name.trim()) {
      setError("Tên không được để trống!");
      return;
    }

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email và Mật Khẩu không được để trống!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      console.log(
        `Attempting to ${mode === "login" ? "login" : "register"}...`
      );
      const success =
        mode === "login"
          ? await onSubmit({
              email: formData.email,
              password: formData.password,
            })
          : await onSubmit({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              role: formData.role,
            });

      if (success) {
        setSuccess(
          mode === "login"
            ? "Đăng nhập thành công! Đang chuyển hướng..."
            : "Đăng ký thành công! Đang chuyển hướng..."
        );
        console.log("Xác thực thành công, đang chờ chuyển hướng...");
      } else {
        setError(
          mode === "login"
            ? "Thông tin đăng nhập không hợp lệ"
            : "Email đã tồn tại"
        );
      }
    } catch (err) {
      console.error("Lỗi xác thực:", err);
      setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {mode === "login" ? "Chào mừng trở lại" : "Tham gia EduBridge"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "login"
              ? "Đăng nhập để tiếp tục"
              : "Tạo tài khoản để bắt đầu hành trình của bạn"}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tên của bạn
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200"
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tài khoản email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200"
                  placeholder="Nhập địa chỉ email của bạn"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all duration-200"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tôi là ...
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                >
                  <option value="donor">
                    Nhà tài trợ - Tôi muốn quyên góp thiết bị
                  </option>
                  <option value="school">
                    Trường học - Tôi cần thiết bị cho học sinh của tôi
                  </option>
                </select>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 py-2 px-3 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : mode === "login" ? (
                  "Đăng nhập"
                ) : (
                  "Tạo tài khoản"
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={onModeChange}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                {mode === "login"
                  ? "Chưa có tài khoản? Đăng ký ngay"
                  : "Đã có tài khoản? Đăng nhập"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
