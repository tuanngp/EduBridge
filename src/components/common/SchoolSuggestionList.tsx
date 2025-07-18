import React, { useState, useEffect } from 'react';
import { School, MapPin, Users, Phone, Star, Loader2 } from 'lucide-react';
import { getSuggestedSchools } from '../../services/schoolSuggestionService';

interface SchoolSuggestionListProps {
  deviceId: string;
  onSelectSchool?: (schoolId: string) => void;
}

interface SchoolSuggestion {
  id: string;
  school_name: string;
  address: string;
  phone: string;
  student_count: number;
  contact_person: string;
  distance?: number;
  matchScore?: number;
}

const SchoolSuggestionList: React.FC<SchoolSuggestionListProps> = ({ deviceId, onSelectSchool }) => {
  const [suggestedSchools, setSuggestedSchools] = useState<SchoolSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestedSchools = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const schools = await getSuggestedSchools(deviceId);
        setSuggestedSchools(schools);
      } catch (err) {
        console.error('Error fetching suggested schools:', err);
        setError('Không thể tải danh sách trường học gợi ý. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    if (deviceId) {
      fetchSuggestedSchools();
    }
  }, [deviceId]);

  const formatDistance = (distance?: number) => {
    if (distance === undefined || distance === null) return 'Không có dữ liệu';
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };

  const getMatchScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-green-400';
    if (score >= 40) return 'bg-yellow-400';
    if (score >= 20) return 'bg-yellow-300';
    return 'bg-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Đang tìm kiếm trường học phù hợp...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (suggestedSchools.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        Không tìm thấy trường học phù hợp. Vui lòng thử lại sau hoặc chọn trường học thủ công.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Trường học phù hợp</h3>
      <p className="text-sm text-gray-500">
        Dựa trên nhu cầu và vị trí địa lý, chúng tôi đề xuất các trường học sau đây cho thiết bị của bạn:
      </p>
      
      <div className="space-y-3">
        {suggestedSchools.map((school) => (
          <div 
            key={school.id} 
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{school.school_name}</h4>
                
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{school.address}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{school.student_count} học sinh</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{school.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                {school.matchScore !== undefined && (
                  <div className="flex items-center mb-2">
                    <div className={`h-2 w-16 rounded-full ${getMatchScoreColor(school.matchScore)}`}></div>
                    <span className="ml-2 text-sm font-medium">
                      {school.matchScore}% phù hợp
                    </span>
                  </div>
                )}
                
                {school.distance !== undefined && (
                  <div className="text-sm text-gray-500">
                    Khoảng cách: {formatDistance(school.distance)}
                  </div>
                )}
              </div>
            </div>
            
            {onSelectSchool && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onSelectSchool(school.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                >
                  Chọn trường này
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolSuggestionList;