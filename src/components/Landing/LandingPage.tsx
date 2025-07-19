import React from "react";
import {
  GraduationCap,
  Heart,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Heart,
      title: "Quyên góp dễ dàng",
      description:
        "Người quyên góp có thể dễ dàng gửi thông tin thiết bị và theo dõi quá trình đóng góp đến các trường học cần hỗ trợ.",
    },
    {
      icon: Users,
      title: "Kết nối với trường học",
      description:
        "Các trường học có thể duyệt danh sách thiết bị quyên góp và gửi yêu cầu cho những thiết bị phù hợp với nhu cầu.",
    },
    {
      icon: CheckCircle,
      title: "Tác động minh bạch",
      description:
        "Theo dõi tác động thực tế của mỗi lượt quyên góp thông qua hệ thống ghép nối và xác nhận giao hàng minh bạch.",
    },
  ];

  const stats = [
    { number: "500+", label: "Thiết bị được quyên góp" },
    { number: "50+", label: "Trường học được trợ giúp" },
    { number: "100+", label: "Nhà tài trợ đang hoạt động" },
    { number: "5000+", label: "Học sinh được tiếp cận" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EduBridge</h1>
                <p className="text-xs text-gray-500">
                  Kết nối cộng đồng học tập
                </p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Thu Hẹp
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Khoảng Cách Số
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Kết nối các nhà hảo tâm với những trường học đang cần hỗ trợ. Mỗi
              thiết bị được quyên góp giúp học sinh tiếp cận nền giáo dục chất
              lượng và xây dựng một tương lai tươi sáng hơn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2"
              >
                <span>Bắt đầu tạo ảnh hưởng</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200">
                Xem thêm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Đơn giản. Minh bạch. Hiệu quả.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nền tảng của chúng tôi giúp các nhà hảo tâm và trường học kết nối
              dễ dàng, đảm bảo mỗi thiết bị được trao đến đúng tay những học
              sinh cần nó nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              EduBridge hoạt động như thế nào?
            </h2>
            <p className="text-xl text-gray-600">
              Chỉ với 3 bước đơn giản để tạo nên ảnh hưởng bền vững cho giáo
              dục.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Người quyên góp gửi thiết bị",
                description:
                  "Các tổ chức và cá nhân gửi thông tin về thiết bị mà họ muốn quyên góp.",
              },
              {
                step: "02",
                title: "Trường học gửi yêu cầu",
                description:
                  "Trường học duyệt các thiết bị có sẵn và gửi yêu cầu cho những thiết bị mà họ đang cần.",
              },
              {
                step: "03",
                title: "Chúng tôi kết nối",
                description:
                  "Nền tảng sẽ kết nối và đảm bảo thiết bị đến tay học sinh đúng lúc, đúng nơi.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Sẵn sàng tạo nên sự khác biệt?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Hãy tham gia cộng đồng của chúng tôi – nơi các nhà quyên góp và
            trường học cùng nhau mang công nghệ đến với mọi học sinh.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl inline-flex items-center space-x-2"
          >
            <span>Tham gia EduBridge ngay hôm nay</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">EduBridge</span>
          </div>
          <p className="text-gray-400 mb-6">
            Kết nối cộng đồng học tập thông qua những thiết bị công nghệ được
            trao tặng
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 EduBridge. Mọi quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
