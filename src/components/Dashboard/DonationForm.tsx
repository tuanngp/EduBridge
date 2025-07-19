import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, Camera, Loader2, Scan, Upload, Link } from 'lucide-react';
import ImageUploader from '../common/ImageUploader';
import apiService from '../../services/api';
import { analyzeDeviceDescription } from '../../services/deviceSuggestionService';
import productAnalyzerService from '../../services/productAnalyzerService';
import { AnalysisResult, ConditionRating } from '../../types/productAnalyzer';

interface DonationFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

const DonationForm: React.FC<DonationFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deviceType: '',
    condition: 'new',
    quantity: '1',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{
    deviceType?: string;
    condition?: string;
    specifications?: Record<string, string>;
    confidence: number;
  } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  
  // Product recognition states
  const [recognitionMethod, setRecognitionMethod] = useState<'camera' | 'upload' | 'url' | null>(null);
  const [productAnalysisResult, setProductAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  
  // Refs for camera functionality
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deviceTypes = [
    'Laptop',
    'Máy tính bàn',
    'Máy tính bảng',
    'Điện thoại thông minh',
    'Màn hình',
    'Bàn phím',
    'Chuột',
    'Máy in',
    'Máy chiếu',
    'Webcam',
    'Khác',
  ];

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Reset camera when not active
  useEffect(() => {
    if (!isCameraActive && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isCameraActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      let imageUrls: string[] = [];
      
      // Upload images if there are any
      if (imageFiles.length > 0) {
        const response = await apiService.uploadImages(imageFiles, 'devices');
        if (response.data && response.data.urls) {
          imageUrls = response.data.urls;
        } else {
          throw new Error('Failed to upload images');
        }
      }
      
      // Submit form data with image URLs
      onSubmit({
        ...formData,
        images: imageUrls,
        device_type: formData.deviceType, // Map to API expected format
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  // Add debounce function for description analysis
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Analyze description for suggestions
  const analyzeDescription = async (description: string) => {
    if (description.length < 10) {
      setSuggestions(null);
      return;
    }

    try {
      setIsSuggesting(true);
      
      // First try client-side analysis for immediate feedback
      const clientSuggestion = analyzeDeviceDescription(description);
      
      // If confidence is high enough, show immediately
      if (clientSuggestion.confidence > 50) {
        setSuggestions(clientSuggestion);
        setShowSuggestions(true);
      }
      
      // Then get server-side analysis for more accurate results
      const response = await apiService.getDeviceSuggestions(description);
      if (response.data?.suggestion) {
        setSuggestions(response.data.suggestion);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error getting device suggestions:', error);
      // If server request fails, fall back to client-side analysis
      const fallbackSuggestion = analyzeDeviceDescription(description);
      if (fallbackSuggestion.confidence > 30) {
        setSuggestions(fallbackSuggestion);
        setShowSuggestions(true);
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  // Create debounced version of analyzeDescription
  const debouncedAnalyzeDescription = debounce(analyzeDescription, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // If description changes, analyze it for suggestions
    if (name === 'description' && value.length >= 10) {
      debouncedAnalyzeDescription(value);
    }
  };
  
  // Apply suggestions to form data
  const applySuggestions = () => {
    if (!suggestions) return;
    
    const updates: Partial<typeof formData> = {};
    
    if (suggestions.deviceType && !formData.deviceType) {
      updates.deviceType = suggestions.deviceType;
    }
    
    if (suggestions.condition) {
      updates.condition = suggestions.condition;
    }
    
    if (suggestions.specifications && Object.keys(suggestions.specifications).length > 0) {
      // If we have specifications, update the name if it's empty
      if (!formData.name) {
        const specs = suggestions.specifications;
        let suggestedName = '';
        
        if (suggestions.deviceType) {
          suggestedName = suggestions.deviceType;
          
          // Add year if available
          if (specs['Year']) {
            suggestedName += ` ${specs['Year']}`;
          }
          
          // Add processor if available
          if (specs['Processor']) {
            suggestedName += ` with ${specs['Processor']}`;
          }
          
          // Add RAM if available
          if (specs['RAM']) {
            suggestedName += `, ${specs['RAM']}`;
          }
          
          // Add storage if available
          if (specs['Storage']) {
            suggestedName += `, ${specs['Storage']}`;
          }
        }
        
        if (suggestedName) {
          updates.name = suggestedName;
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
      
      // Hide suggestions after applying
      setShowSuggestions(false);
    }
  };
  
  // Dismiss suggestions
  const dismissSuggestions = () => {
    setShowSuggestions(false);
  };

  // Product recognition functions
  const startCameraRecognition = async () => {
    try {
      setAnalysisError(null);
      setRecognitionMethod('camera');
      setIsCameraActive(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setAnalysisError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.');
      setIsCameraActive(false);
      console.error('Camera access error:', err);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      setAnalysisError('Camera chưa được khởi tạo đúng cách');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCameraPreview(imageDataUrl);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsCameraActive(false);
      
      // Auto-analyze captured image
      analyzeProductImage(imageDataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Vui lòng chọn file hình ảnh');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setRecognitionMethod('upload');
    analyzeProductImage(objectUrl);
  };

  const handleUrlAnalysis = () => {
    if (!imageUrl) {
      setAnalysisError('Vui lòng nhập URL hình ảnh');
      return;
    }

    try {
      new URL(imageUrl);
      setRecognitionMethod('url');
      analyzeProductImage(imageUrl);
    } catch {
      setAnalysisError('URL không hợp lệ');
    }
  };

  const analyzeProductImage = async (imageUrlToAnalyze: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const response = await productAnalyzerService.analyzeProduct({
        imageUrl: imageUrlToAnalyze,
        options: {
          detailLevel: 'standard',
          prioritizeCondition: true
        }
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Phân tích thất bại');
      }
      
      setProductAnalysisResult(response.data);
      
      // Auto-fill form based on analysis
      applyProductAnalysis(response.data);
      
    } catch (err: any) {
      setAnalysisError(err.message || 'Có lỗi xảy ra trong quá trình phân tích');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyProductAnalysis = (analysis: AnalysisResult) => {
    const updates: Partial<typeof formData> = {};
    
    // Map product type to device type
    const productType = analysis.productInfo.type.toLowerCase();
    if (productType.includes('laptop') || productType.includes('máy tính xách tay')) {
      updates.deviceType = 'Laptop';
    } else if (productType.includes('desktop') || productType.includes('máy tính bàn')) {
      updates.deviceType = 'Máy tính bàn';
    } else if (productType.includes('tablet') || productType.includes('máy tính bảng')) {
      updates.deviceType = 'Máy tính bảng';
    } else if (productType.includes('phone') || productType.includes('điện thoại')) {
      updates.deviceType = 'Điện thoại thông minh';
    } else if (productType.includes('monitor') || productType.includes('màn hình')) {
      updates.deviceType = 'Màn hình';
    } else if (productType.includes('keyboard') || productType.includes('bàn phím')) {
      updates.deviceType = 'Bàn phím';
    } else if (productType.includes('mouse') || productType.includes('chuột')) {
      updates.deviceType = 'Chuột';
    } else if (productType.includes('printer') || productType.includes('máy in')) {
      updates.deviceType = 'Máy in';
    } else if (productType.includes('projector') || productType.includes('máy chiếu')) {
      updates.deviceType = 'Máy chiếu';
    } else if (productType.includes('webcam') || productType.includes('camera')) {
      updates.deviceType = 'Webcam';
    } else {
      updates.deviceType = 'Khác';
    }
    
    // Map condition
    const condition = analysis.conditionAssessment.overallCondition;
    if (condition === ConditionRating.NEW || condition === ConditionRating.LIKE_NEW) {
      updates.condition = 'new';
    } else if (condition === ConditionRating.GOOD) {
      updates.condition = 'used-good';
    } else if (condition === ConditionRating.FAIR || condition === ConditionRating.POOR) {
      updates.condition = 'used-fair';
    }
    
    // Generate device name
    let deviceName = '';
    if (analysis.productInfo.brand) {
      deviceName += analysis.productInfo.brand;
    }
    if (analysis.productInfo.model) {
      deviceName += ` ${analysis.productInfo.model}`;
    }
    if (!deviceName && analysis.productInfo.type) {
      deviceName = analysis.productInfo.type;
    }
    if (deviceName) {
      updates.name = deviceName;
    }
    
    // Generate description from analysis
    let description = analysis.summary || '';
    if (analysis.conditionAssessment.conditionExplanation) {
      description += `\n\nTình trạng: ${analysis.conditionAssessment.conditionExplanation}`;
    }
    if (analysis.productInfo.features && analysis.productInfo.features.length > 0) {
      description += `\n\nTính năng: ${analysis.productInfo.features.join(', ')}`;
    }
    if (description) {
      updates.description = description.trim();
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
    }
  };

  const resetProductRecognition = () => {
    setRecognitionMethod(null);
    setProductAnalysisResult(null);
    setAnalysisError(null);
    setImageUrl('');
    setCameraPreview(null);
    setIsCameraActive(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Gửi quyên góp</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Recognition Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Scan className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Nhận diện sản phẩm tự động</h3>
              </div>
              {(productAnalysisResult || recognitionMethod) && (
                <button
                  type="button"
                  onClick={resetProductRecognition}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Đặt lại
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Chụp ảnh hoặc tải lên hình ảnh thiết bị để tự động điền thông tin
            </p>

            {/* Recognition Method Selection */}
            {!recognitionMethod && !productAnalysisResult && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={startCameraRecognition}
                  className="flex flex-col items-center p-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Camera className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Chụp ảnh</span>
                </button>
                
                <label className="flex flex-col items-center p-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Tải ảnh lên</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                
                <div className="flex flex-col items-center p-4 border border-blue-300 rounded-lg">
                  <Link className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="w-full">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="URL hình ảnh"
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded mb-2"
                    />
                    <button
                      type="button"
                      onClick={handleUrlAnalysis}
                      className="w-full text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                    >
                      Phân tích
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Interface */}
            {isCameraActive && (
              <div className="mt-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                      type="button"
                      onClick={captureImage}
                      className="bg-white text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraActive(false);
                        setRecognitionMethod(null);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Analysis Loading */}
            {isAnalyzing && (
              <div className="mt-4 flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  <span className="text-gray-700">Đang phân tích hình ảnh...</span>
                </div>
              </div>
            )}

            {/* Analysis Error */}
            {analysisError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{analysisError}</p>
              </div>
            )}

                         {/* Captured Image Preview */}
            {cameraPreview && !productAnalysisResult && !isAnalyzing && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Ảnh đã chụp:</h4>
                <img 
                  src={cameraPreview} 
                  alt="Captured preview" 
                  className="w-full max-w-sm mx-auto rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Analysis Result */}
            {productAnalysisResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <Scan className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Phân tích hoàn tất!</span>
                </div>
                
                {/* Show captured image if available */}
                {cameraPreview && (
                  <div className="mb-4">
                    <img 
                      src={cameraPreview} 
                      alt="Analyzed image" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin sản phẩm:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li><strong>Loại:</strong> {productAnalysisResult.productInfo.type}</li>
                      {productAnalysisResult.productInfo.brand && (
                        <li><strong>Thương hiệu:</strong> {productAnalysisResult.productInfo.brand}</li>
                      )}
                      {productAnalysisResult.productInfo.model && (
                        <li><strong>Model:</strong> {productAnalysisResult.productInfo.model}</li>
                      )}
                      {productAnalysisResult.productInfo.color && (
                        <li><strong>Màu sắc:</strong> {productAnalysisResult.productInfo.color}</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tình trạng:</h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div><strong>Đánh giá:</strong> {productAnalysisResult.conditionAssessment.overallCondition}</div>
                      <div><strong>Độ tin cậy:</strong> {productAnalysisResult.conditionAssessment.confidenceScore}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Tóm tắt:</strong> {productAnalysisResult.summary}
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  Thông tin đã được tự động điền vào form. Vui lòng kiểm tra và chỉnh sửa nếu cần.
                </div>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Device Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="e.g., MacBook Pro 13-inch"
            />
          </div>

          <div>
            <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Device Type *
            </label>
            <select
              id="deviceType"
              name="deviceType"
              required
              value={formData.deviceType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">Chọn loại thiết bị</option>
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition *
            </label>
            <select
              id="condition"
              name="condition"
              required
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="new">Mới</option>
              <option value="used-good">Đã qua sử dụng - Tình trạng tốt</option>
              <option value="used-fair">Đã qua sử dụng - Tình trạng khá</option>
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả *
            </label>
            <div className="relative">
                         <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Cung cấp thông tin chi tiết về thiết bị, bao gồm thông số kỹ thuật, phụ kiện đi kèm, địa điểm nhận hàng, v.v."
              />
              {isSuggesting && (
                <div className="absolute right-3 top-3 text-blue-500">
                  <div className="animate-pulse">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Suggestions panel */}
            {showSuggestions && suggestions && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-700">Chúng tôi đã tìm thấy một số gợi ý dựa trên mô tả của bạn</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={applySuggestions}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      onClick={dismissSuggestions}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {suggestions.deviceType && (
                    <div className="flex items-center">
                      <span className="text-gray-600 w-24">Loại thiết bị:</span>
                      <span className="font-medium">{suggestions.deviceType}</span>
                    </div>
                  )}
                  
                  {suggestions.condition && (
                    <div className="flex items-center">
                      <span className="text-gray-600 w-24">Tình trạng:</span>
                      <span className="font-medium">
                        {suggestions.condition === 'new' ? 'Mới' : 
                         suggestions.condition === 'used-good' ? 'Đã qua sử dụng - Tình trạng tốt' : 
                         'Đã qua sử dụng - Tình trạng khá'}
                      </span>
                    </div>
                  )}
                  
                  {suggestions.specifications && Object.keys(suggestions.specifications).length > 0 && (
                    <div className="mt-1">
                      <span className="text-gray-600">Specifications:</span>
                      <div className="ml-2 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(suggestions.specifications).map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <span className="text-gray-600 mr-1">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh thiết bị
            </label>
            <ImageUploader 
              onImagesChange={setImageFiles} 
              maxImages={5}
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              disabled={isUploading || isAnalyzing}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={isUploading || isAnalyzing}
            >
              Xác nhận
              {isUploading ? 'Uploading...' : 'Submit Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationForm;