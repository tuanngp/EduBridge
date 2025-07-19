import React, { useState, useEffect } from 'react';
import { Plus, Package, Clock, CheckCircle, Edit3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Donor, Donation } from '../../types';
import { getDonorByUserId, saveDonor, getDonationsByDonorId, saveDonation, generateId } from '../../utils/storage';
import DonationForm from './DonationForm';

const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    organization: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      const existingDonor = getDonorByUserId(user.id);
      if (existingDonor) {
        setDonor(existingDonor);
        setProfileForm({
          organization: existingDonor.organization,
          phone: existingDonor.phone,
        });
        loadDonations(existingDonor.id);
      } else {
        setShowProfileForm(true);
      }
    }
  }, [user]);

  const loadDonations = (donorId: string) => {
    const donorDonations = getDonationsByDonorId(donorId);
    setDonations(donorDonations);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newDonor: Donor = {
      id: donor?.id || generateId(),
      userId: user.id,
      organization: profileForm.organization,
      phone: profileForm.phone,
      createdAt: donor?.createdAt || new Date().toISOString(),
    };

    saveDonor(newDonor);
    setDonor(newDonor);
    setShowProfileForm(false);
    loadDonations(newDonor.id);
  };

  const handleDonationSubmit = (donationData: any) => {
    if (!donor) return;

    const newDonation: Donation = {
      id: generateId(),
      donorId: donor.id,
      name: donationData.name,
      description: donationData.description,
      deviceType: donationData.deviceType,
      condition: donationData.condition,
      quantity: parseInt(donationData.quantity),
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    saveDonation(newDonation);
    loadDonations(donor.id);
    setShowDonationForm(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'claimed': return <Package className="h-4 w-4 text-orange-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'claimed': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showProfileForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hoàn thành hồ sơ của nhà tài trợ</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                Tên tổ chức
              </label>
              <input
                id="organization"
                type="text"
                required
                value={profileForm.organization}
                onChange={(e) => setProfileForm(prev => ({ ...prev, organization: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Nhập tên tổ chức"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Lưu hồ sơ
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trang tổng quan về nhà tài trợ</h1>
          <p className="mt-2 text-gray-600">Quản lý các khoản quyên góp thiết bị của bạn và giúp đỡ các trường học đang gặp khó khăn</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={() => setShowProfileForm(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <Edit3 className="h-4 w-4" />
            <span>Chỉnh sửa hồ sơ</span>
          </button>
          <button
            onClick={() => setShowDonationForm(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            <span>Quyên góp</span>
          </button>
        </div>
      </div>

      {/* Profile Summary */}
      {donor && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hồ sơ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tổ chức</p>
              <p className="font-medium text-gray-900">{donor.organization}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Liên hệ</p>
              <p className="font-medium text-gray-900">{donor.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng số quyên góp</p>
              <p className="font-medium text-gray-900">{donations.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Donations List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Khoản quyên góp của bạn</h2>
        {donations.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có khoản quyên góp nào</h3>
            <p className="text-gray-500 mb-6">Hãy bắt đầu tạo nên sự khác biệt bằng cách gửi khoản quyên góp đầu tiên của bạn</p>
            <button
              onClick={() => setShowDonationForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Gửi khoản quyên góp đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <div key={donation.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{donation.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                    {getStatusIcon(donation.status)}
                    <span className="ml-1">{donation.status}</span>
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{donation.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loại:</span>
                    <span className="font-medium">{donation.deviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tình trạng:</span>
                    <span className="font-medium">{donation.condition.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Số lượng:</span>
                    <span className="font-medium">{donation.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày gửi:</span>
                    <span className="font-medium">{new Date(donation.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donation Form Modal */}
      {showDonationForm && (
        <DonationForm
          onSubmit={handleDonationSubmit}
          onClose={() => setShowDonationForm(false)}
        />
      )}
    </div>
  );
};

export default DonorDashboard;