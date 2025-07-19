import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import { ProductAnalyzerProps, ProductAnalyzerRef, AnalysisResult } from '../../types/productAnalyzer';
import productAnalyzerService from '../../services/productAnalyzerService';
import ResultsDisplay from './ResultsDisplay';
import './ProductAnalyzer.css';

/**
 * ProductAnalyzer component for analyzing product images
 * Implements image URL input, file upload, and camera capture functionality
 */
const ProductAnalyzer = forwardRef<ProductAnalyzerRef, ProductAnalyzerProps>(
    ({ onAnalysisComplete, initialUrl = '', className = '' }, ref) => {
        // State for form inputs and UI
        const [imageUrl, setImageUrl] = useState<string>(initialUrl);
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [error, setError] = useState<string | null>(null);
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);
        const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
        const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
        const [uploadMethod, setUploadMethod] = useState<'url' | 'file' | 'camera'>('url');
        
        // Refs for file input and video elements
        const fileInputRef = useRef<HTMLInputElement>(null);
        const videoRef = useRef<HTMLVideoElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const streamRef = useRef<MediaStream | null>(null);

        // Clean up camera stream when component unmounts or camera is deactivated
        useEffect(() => {
            return () => {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };
        }, []);

        // Reset camera when isCameraActive changes to false
        useEffect(() => {
            if (!isCameraActive && streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }, [isCameraActive]);

        // Validate URL format
        const isValidUrl = (url: string): boolean => {
            try {
                new URL(url);
                return true;
            } catch (e) {
                return false;
            }
        };

        // Validate image URL (basic check)
        const isImageUrl = (url: string): boolean => {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
            const lowerUrl = url.toLowerCase();
            return imageExtensions.some(ext => lowerUrl.endsWith(ext)) || lowerUrl.includes('/image/');
        };

        // Handle file selection
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) {
                setError('No file selected');
                setPreviewUrl(null);
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Selected file is not an image');
                setPreviewUrl(null);
                return;
            }

            // Create preview URL
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setError(null);
            setUploadMethod('file');
            
            // Clear URL input when file is selected
            setImageUrl('');
        };

        // Handle camera activation
        const activateCamera = async () => {
            try {
                setError(null);
                setIsCameraActive(true);
                setUploadMethod('camera');
                
                // Clear URL input when camera is activated
                setImageUrl('');
                setPreviewUrl(null);

                // Request camera access
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                
                streamRef.current = stream;
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                setError('Failed to access camera. Please ensure you have granted camera permissions.');
                setIsCameraActive(false);
                console.error('Camera access error:', err);
            }
        };

        // Handle camera capture
        const captureImage = () => {
            if (!videoRef.current || !canvasRef.current) {
                setError('Camera not initialized properly');
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw video frame to canvas
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to data URL
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                setPreviewUrl(imageDataUrl);
                
                // Stop camera stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                
                setIsCameraActive(false);
            }
        };

        // Handle URL input change
        const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const url = e.target.value;
            setImageUrl(url);
            setUploadMethod('url');
            
            // Clear preview when URL is entered
            if (previewUrl) {
                setPreviewUrl(null);
            }
            
            // Basic URL validation
            if (url && !isValidUrl(url)) {
                setError('Please enter a valid URL');
            } else if (url && !isImageUrl(url)) {
                setError('URL does not appear to be an image');
            } else {
                setError(null);
            }
        };

        // Handle form submission
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            await analyzeImage();
        };

        // Main analysis function
        const analyzeImage = async (urlOverride?: string) => {
            try {
                setIsLoading(true);
                setError(null);
                setAnalysisResult(null);
                
                let imageUrlToAnalyze = urlOverride || imageUrl;
                
                // Handle file upload if needed
                if (uploadMethod === 'file' && fileInputRef.current?.files?.[0]) {
                    const file = fileInputRef.current.files[0];
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    // Here we would normally upload the file to get a URL
                    // For now, we'll use the preview URL as a placeholder
                    imageUrlToAnalyze = previewUrl || '';
                }
                
                // Handle camera capture if needed
                if (uploadMethod === 'camera' && previewUrl) {
                    // For camera capture, we use the data URL from the canvas
                    imageUrlToAnalyze = previewUrl;
                }
                
                // Validate final URL
                if (!imageUrlToAnalyze) {
                    throw new Error('No image URL provided');
                }
                
                if (!isValidUrl(imageUrlToAnalyze) && !imageUrlToAnalyze.startsWith('data:image/')) {
                    throw new Error('Invalid image URL format');
                }
                
                // Call the analysis service
                const response = await productAnalyzerService.analyzeProduct({
                    imageUrl: imageUrlToAnalyze,
                    options: {
                        detailLevel: 'standard',
                        prioritizeCondition: true
                    }
                });
                
                if (!response.success || !response.data) {
                    throw new Error(response.error?.message || 'Analysis failed');
                }
                
                // Log metadata for debugging
                if (response.metadata && process.env.NODE_ENV === 'development') {
                    console.log('Analysis metadata:', response.metadata);
                }
                
                // Set the result and call the callback
                setAnalysisResult(response.data);
                if (onAnalysisComplete) {
                    onAnalysisComplete(response.data);
                }
                
                return response.data;
            } catch (err: any) {
                setError(err.message || 'An error occurred during analysis');
                console.error('Analysis error:', err);
                return null;
            } finally {
                setIsLoading(false);
            }
        };

        // Reset the component state
        const resetComponent = () => {
            setImageUrl('');
            setError(null);
            setPreviewUrl(null);
            setAnalysisResult(null);
            setIsCameraActive(false);
            setUploadMethod('url');
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // Stop camera if active
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };

        // Expose methods to parent components
        useImperativeHandle(ref, () => ({
            analyze: async (url: string) => {
                setImageUrl(url);
                const result = await analyzeImage(url);
                if (!result) {
                    throw new Error('Analysis failed');
                }
                return result;
            },
            reset: resetComponent
        }));

        return (
            <div className={`product-analyzer ${className}`}>
                <h2>Product Condition Analyzer</h2>
                <p>Submit a product image to analyze its condition</p>

                {!analysisResult ? (
                    <>
                        <form onSubmit={handleSubmit} className="analyzer-form">
                            {uploadMethod === 'url' && (
                                <div className="form-group">
                                    <label htmlFor="imageUrl">Image URL</label>
                                    <input
                                        type="text"
                                        id="imageUrl"
                                        value={imageUrl}
                                        onChange={handleUrlChange}
                                        placeholder="Enter image URL"
                                        disabled={isLoading}
                                        className="url-input"
                                    />
                                </div>
                            )}

                            {uploadMethod === 'file' && (
                                <div className="form-group file-upload">
                                    <label htmlFor="imageFile">Image File</label>
                                    <input
                                        type="file"
                                        id="imageFile"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        disabled={isLoading}
                                        className="file-input"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setUploadMethod('url')}
                                        className="switch-method-btn"
                                    >
                                        Use URL Instead
                                    </button>
                                </div>
                            )}

                            {uploadMethod === 'camera' && !isCameraActive && !previewUrl && (
                                <div className="form-group camera-group">
                                    <button 
                                        type="button" 
                                        onClick={activateCamera}
                                        className="camera-btn"
                                        disabled={isLoading}
                                    >
                                        Start Camera
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setUploadMethod('url')}
                                        className="switch-method-btn"
                                    >
                                        Use URL Instead
                                    </button>
                                </div>
                            )}

                            {isCameraActive && (
                                <div className="camera-container">
                                    <video 
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="camera-preview"
                                    />
                                    <button 
                                        type="button"
                                        onClick={captureImage}
                                        className="capture-btn"
                                    >
                                        Capture
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (streamRef.current) {
                                                streamRef.current.getTracks().forEach(track => track.stop());
                                                streamRef.current = null;
                                            }
                                            setIsCameraActive(false);
                                            setUploadMethod('url');
                                        }}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                </div>
                            )}

                            {previewUrl && (
                                <div className="preview-container">
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        className="image-preview" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setPreviewUrl(null);
                                            if (uploadMethod === 'file' && fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className="remove-preview-btn"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}

                            {error && <div className="error-message">{error}</div>}

                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    disabled={isLoading || (!imageUrl && !previewUrl)}
                                    className="analyze-btn"
                                >
                                    {isLoading ? 'Analyzing...' : 'Analyze Product'}
                                </button>
                                
                                {isLoading && (
                                    <div className="loading-indicator">
                                        <div className="spinner"></div>
                                        <p>Analyzing your product image...</p>
                                    </div>
                                )}
                            </div>
                        </form>

                        <div className="upload-options">
                            <p>Choose upload method:</p>
                            <div className="upload-buttons">
                                <button 
                                    onClick={() => setUploadMethod('url')}
                                    disabled={isLoading || uploadMethod === 'url'}
                                    className={`method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                                >
                                    URL
                                </button>
                                <button 
                                    onClick={() => {
                                        setUploadMethod('file');
                                        setTimeout(() => {
                                            fileInputRef.current?.click();
                                        }, 0);
                                    }}
                                    disabled={isLoading || uploadMethod === 'file'}
                                    className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                                >
                                    Upload File
                                </button>
                                <button 
                                    onClick={() => {
                                        setUploadMethod('camera');
                                        if (!previewUrl) {
                                            activateCamera();
                                        }
                                    }}
                                    disabled={isLoading || uploadMethod === 'camera'}
                                    className={`method-btn ${uploadMethod === 'camera' ? 'active' : ''}`}
                                >
                                    Camera
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="analysis-results">
                        <ResultsDisplay result={analysisResult} />
                        <button 
                            onClick={resetComponent}
                            className="new-analysis-btn"
                        >
                            Analyze Another Product
                        </button>
                    </div>
                )}
            </div>
        );
    }
);

export default ProductAnalyzer;