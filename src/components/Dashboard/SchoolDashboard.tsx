import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, CheckCircle, Edit3, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { School, Donor, Need, Device } from '../../types';
import { getSchoolByUserId, saveSchool, getRequestsBySchoolId, saveRequest, getDonations, generateId } from '../../services/dataService';
import EnhancedRequestForm from './EnhancedRequestForm';

const SchoolDashboard: React.FC = () => {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [requests, setRequests] = useState<Need[]>([]);
  const [availableDonations, setAvailableDonations] = useState<Device[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'donations'>('requests');
  const [profileForm, setProfileForm] = useState({
    schoolName: '',
    location: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const existingSchool = await getSchoolByUserId(user!.id);
      if (existingSchool) {
        setSchool(existingSchool);
        setProfileForm({
          schoolName: existingSchool.school_name,
          location: existingSchool.address,
          phone: existingSchool.phone,
        });
        await loadRequests(existingSchool.id);
      } else {
        setShowProfileForm(true);
      }
      await loadAvailableDonations();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (schoolId: string) => {
    try {
      const schoolRequests = await getRequestsBySchoolId(schoolId);
      setRequests(schoolRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequests([]);
    }
  };

  const loadAvailableDonations = async () => {
    try {
      const allDonations = await getDonations();
      const available = allDonations.filter(d => d.status === 'approved');
      setAvailableDonations(available);
    } catch (error) {
      console.error('Error loading donations:', error);
      setAvailableDonations([]);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const newSchool: School = {
        id: school?.id || generateId(),
        user_id: user.id,
        school_name: profileForm.schoolName,
        address: profileForm.location,
        phone: profileForm.phone,
        created_at: school?.created_at || new Date().toISOString(),
        contact_person: '',
        is_verified: false,
        updated_at: new Date().toISOString(),
      };

      await saveSchool(newSchool);
      setSchool(newSchool);
      setShowProfileForm(false);
      await loadRequests(newSchool.id);
    } catch (error) {
      console.error('Error saving school profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (requestData: any) => {
    if (!school) return;

    setLoading(true);
    try {
      const newRequest: Need = {
        id: generateId(),
        school_id: school.id,
        device_type: requestData.device_type || '',
        quantity: parseInt(requestData.quantity),
        description: requestData.description,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: requestData.priority,
      };

      await saveRequest(newRequest);
      await loadRequests(school.id);
      setShowRequestForm(false);
    } catch (error) {
      console.error('Error saving request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'fulfilled': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'used-good': return 'bg-blue-100 text-blue-800';
      case 'used-fair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showProfileForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your School Profile</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                Tên trường
              </label>
              <input
                id="schoolName"
                type="text"
                required
                value={profileForm.schoolName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, schoolName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Nhập tên trường của bạn"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                required
                value={profileForm.location}
                onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your school location"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your phone number"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
          <h1 className="text-3xl font-bold text-gray-900">Bảng thông tin trường học</h1>
          <p className="mt-2 text-gray-600">Quản lý các yêu cầu về thiết bị của bạn và duyệt các khoản quyên góp có sẵn</p>
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
            onClick={() => setShowRequestForm(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            <span>Yêu cầu mới</span>
          </button>
        </div>
      </div>

      {/* Profile Summary */}
      {school && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin trường học</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">School Name</p>
              <p className="font-medium text-gray-900">{school.school_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{school.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng số yêu cầu</p>
              <p className="font-medium text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Yêu cầu của tôi</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'donations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Khoản quyên góp sẵn có</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            activeTab === 'requests' ? (
              requests.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-500 mb-6">Submit your first device request to get started</p>
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Submit First Request
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{request.device_type}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{request.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Quantity:</span>
                          <span className="font-medium">{request.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Submitted:</span>
                          <span className="font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              availableDonations.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No donations available</h3>
                  <p className="text-gray-500">Check back later for new device donations</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableDonations.map((donation) => (
                    <div key={donation.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{donation.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(donation.condition)}`}>
                          {donation.condition.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{donation.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span className="font-medium">{donation.device_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Quantity:</span>
                          <span className="font-medium">{donation.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Available since:</span>
                          <span className="font-medium">{new Date(donation.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ))};
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <EnhancedRequestForm
          onSubmit={handleRequestSubmit}
          onClose={() => setShowRequestForm(false)}
        />
      )};
    </div>
  );
};

export default SchoolDashboard;