import React, { useState } from 'react';
import { AnalysisResult, ConditionRating } from '../../types/productAnalyzer';

interface ResultsDisplayProps {
  result: AnalysisResult | null;
  className?: string;
}

/**
 * ResultsDisplay component for showing product analysis results
 * Implements a structured view for product information, condition assessment visualization,
 * and export/share functionality
 */
const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, className = '' }) => {
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf' | 'text'>('json');
  const [copySuccess, setCopySuccess] = useState<string>('');

  if (!result) {
    return null;
  }

  // Get color for condition rating visualization
  const getConditionColor = (condition: ConditionRating): string => {
    switch (condition) {
      case ConditionRating.NEW:
        return '#28a745'; // Green
      case ConditionRating.LIKE_NEW:
        return '#5cb85c'; // Light green
      case ConditionRating.GOOD:
        return '#007bff'; // Blue
      case ConditionRating.FAIR:
        return '#fd7e14'; // Orange
      case ConditionRating.POOR:
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Gray
    }
  };

  // Get background gradient for condition visualization
  const getConditionGradient = (score: number): string => {
    return `linear-gradient(90deg, ${getConditionColor(result.conditionAssessment.overallCondition)} ${score}%, #e9ecef ${score}%)`;
  };

  // Handle export functionality
  const handleExport = () => {
    let content: string = '';
    let filename: string = '';
    let dataType: string = '';

    // Format the data based on selected export format
    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(result, null, 2);
        filename = `product-analysis-${result.requestId}.json`;
        dataType = 'application/json';
        break;
      case 'text':
        content = `
Product Analysis Results
-----------------------
Date: ${new Date(result.timestamp).toLocaleString()}

SUMMARY
${result.summary}

PRODUCT INFORMATION
Type: ${result.productInfo.type}
${result.productInfo.brand ? `Brand: ${result.productInfo.brand}` : ''}
${result.productInfo.model ? `Model: ${result.productInfo.model}` : ''}
${result.productInfo.color ? `Color: ${result.productInfo.color}` : ''}
${result.productInfo.materials && result.productInfo.materials.length > 0 ? `Materials: ${result.productInfo.materials.join(', ')}` : ''}
${result.productInfo.estimatedAge ? `Estimated Age: ${result.productInfo.estimatedAge}` : ''}
${result.productInfo.features && result.productInfo.features.length > 0 ? `Features: ${result.productInfo.features.join(', ')}` : ''}

CONDITION ASSESSMENT
Overall Condition: ${result.conditionAssessment.overallCondition}
Confidence Score: ${result.conditionAssessment.confidenceScore}%

${result.conditionAssessment.conditionExplanation}

${result.conditionAssessment.conditionDetails.wearSigns && result.conditionAssessment.conditionDetails.wearSigns.length > 0 ? 
`Wear Signs:
${result.conditionAssessment.conditionDetails.wearSigns.map(sign => `- ${sign}`).join('\n')}` : ''}

${result.conditionAssessment.conditionDetails.damages && result.conditionAssessment.conditionDetails.damages.length > 0 ? 
`Damages:
${result.conditionAssessment.conditionDetails.damages.map(damage => `- ${damage}`).join('\n')}` : ''}

${result.conditionAssessment.conditionDetails.defects && result.conditionAssessment.conditionDetails.defects.length > 0 ? 
`Defects:
${result.conditionAssessment.conditionDetails.defects.map(defect => `- ${defect}`).join('\n')}` : ''}

${result.conditionAssessment.conditionDetails.positiveAspects && result.conditionAssessment.conditionDetails.positiveAspects.length > 0 ? 
`Positive Aspects:
${result.conditionAssessment.conditionDetails.positiveAspects.map(aspect => `- ${aspect}`).join('\n')}` : ''}
        `;
        filename = `product-analysis-${result.requestId}.txt`;
        dataType = 'text/plain';
        break;
      case 'pdf':
        // In a real implementation, we would use a PDF generation library
        // For now, we'll just use the text format
        content = `PDF generation would be implemented with a library like jsPDF`;
        filename = `product-analysis-${result.requestId}.pdf`;
        dataType = 'application/pdf';
        alert('PDF export would be implemented with a PDF generation library');
        return;
    }

    // Create a download link and trigger it
    const blob = new Blob([content], { type: dataType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle share functionality
  const handleShare = async () => {
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Product Analysis Results',
          text: `Check out this product analysis: ${result.productInfo.type} in ${result.conditionAssessment.overallCondition} condition`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setShareModalOpen(true);
      }
    } else {
      setShareModalOpen(true);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    const textToCopy = `
Product Analysis Results
-----------------------
${result.summary}

Product: ${result.productInfo.type}
${result.productInfo.brand ? `Brand: ${result.productInfo.brand}` : ''}
${result.productInfo.model ? `Model: ${result.productInfo.model}` : ''}
Condition: ${result.conditionAssessment.overallCondition} (${result.conditionAssessment.confidenceScore}% confidence)

${result.conditionAssessment.conditionExplanation}

Analyzed on: ${new Date(result.timestamp).toLocaleString()}
    `;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess('Results copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 3000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setCopySuccess('Failed to copy. Please try again.');
      });
  };

  return (
    <div className={`results-display ${className}`}>
      <h2>Product Analysis Results</h2>
      
      {/* Image Preview */}
      <div className="result-image-container">
        <img 
          src={result.imageUrl} 
          alt="Analyzed Product" 
          className="result-image"
          onError={(e) => {
            // Handle image load error
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjYWFhIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
          }}
        />
      </div>
      
      {/* Summary Section */}
      <div className="summary-section">
        <h3>Summary</h3>
        <p className="summary-text">{result.summary}</p>
      </div>
      
      {/* Product Information Section */}
      <div className="product-info-section">
        <h3>Product Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Type:</span>
            <span className="value">{result.productInfo.type}</span>
          </div>
          
          {result.productInfo.brand && (
            <div className="info-item">
              <span className="label">Brand:</span>
              <span className="value">{result.productInfo.brand}</span>
            </div>
          )}
          
          {result.productInfo.model && (
            <div className="info-item">
              <span className="label">Model:</span>
              <span className="value">{result.productInfo.model}</span>
            </div>
          )}
          
          {result.productInfo.color && (
            <div className="info-item">
              <span className="label">Color:</span>
              <span className="value">{result.productInfo.color}</span>
            </div>
          )}
          
          {result.productInfo.estimatedAge && (
            <div className="info-item">
              <span className="label">Estimated Age:</span>
              <span className="value">{result.productInfo.estimatedAge}</span>
            </div>
          )}
          
          {result.productInfo.materials && result.productInfo.materials.length > 0 && (
            <div className="info-item full-width">
              <span className="label">Materials:</span>
              <span className="value">{result.productInfo.materials.join(', ')}</span>
            </div>
          )}
          
          {result.productInfo.features && result.productInfo.features.length > 0 && (
            <div className="info-item full-width">
              <span className="label">Features:</span>
              <div className="features-list">
                {result.productInfo.features.map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
              </div>
            </div>
          )}
          
          {result.productInfo.dimensions && (
            <div className="info-item full-width">
              <span className="label">Dimensions:</span>
              <span className="value">
                {result.productInfo.dimensions.width && `Width: ${result.productInfo.dimensions.width}${result.productInfo.dimensions.unit || ''}`}
                {result.productInfo.dimensions.height && ` × Height: ${result.productInfo.dimensions.height}${result.productInfo.dimensions.unit || ''}`}
                {result.productInfo.dimensions.depth && ` × Depth: ${result.productInfo.dimensions.depth}${result.productInfo.dimensions.unit || ''}`}
              </span>
            </div>
          )}
          
          <div className="info-item">
            <span className="label">Certainty Score:</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${result.productInfo.certaintyScore}%` }}
              ></div>
              <span className="progress-text">{result.productInfo.certaintyScore}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Condition Assessment Section */}
      <div className="condition-section">
        <h3>Condition Assessment</h3>
        
        <div className="condition-visualization">
          <div className="condition-meter">
            <div className="condition-label">Poor</div>
            <div className="condition-label">Fair</div>
            <div className="condition-label">Good</div>
            <div className="condition-label">Like New</div>
            <div className="condition-label">New</div>
            
            <div className="condition-bar">
              <div 
                className="condition-indicator"
                style={{ 
                  left: `${getConditionPosition(result.conditionAssessment.overallCondition)}%`,
                  backgroundColor: getConditionColor(result.conditionAssessment.overallCondition)
                }}
              ></div>
            </div>
          </div>
          
          <div 
            className="condition-rating"
            style={{ color: getConditionColor(result.conditionAssessment.overallCondition) }}
          >
            {result.conditionAssessment.overallCondition}
          </div>
        </div>
        
        <div className="confidence-score">
          <span className="label">Confidence:</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${result.conditionAssessment.confidenceScore}%`,
                background: getConditionGradient(result.conditionAssessment.confidenceScore)
              }}
            ></div>
            <span className="progress-text">{result.conditionAssessment.confidenceScore}%</span>
          </div>
        </div>
        
        <div className="condition-explanation">
          <h4>Explanation</h4>
          <p>{result.conditionAssessment.conditionExplanation}</p>
        </div>
        
        {/* Condition Details */}
        <div className="condition-details">
          {result.conditionAssessment.conditionDetails.positiveAspects && 
           result.conditionAssessment.conditionDetails.positiveAspects.length > 0 && (
            <div className="detail-section positive">
              <h4>Positive Aspects</h4>
              <ul>
                {result.conditionAssessment.conditionDetails.positiveAspects.map((aspect, index) => (
                  <li key={index}>{aspect}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.conditionAssessment.conditionDetails.wearSigns && 
           result.conditionAssessment.conditionDetails.wearSigns.length > 0 && (
            <div className="detail-section wear">
              <h4>Signs of Wear</h4>
              <ul>
                {result.conditionAssessment.conditionDetails.wearSigns.map((sign, index) => (
                  <li key={index}>{sign}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.conditionAssessment.conditionDetails.damages && 
           result.conditionAssessment.conditionDetails.damages.length > 0 && (
            <div className="detail-section damages">
              <h4>Damages</h4>
              <ul>
                {result.conditionAssessment.conditionDetails.damages.map((damage, index) => (
                  <li key={index}>{damage}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.conditionAssessment.conditionDetails.defects && 
           result.conditionAssessment.conditionDetails.defects.length > 0 && (
            <div className="detail-section defects">
              <h4>Defects</h4>
              <ul>
                {result.conditionAssessment.conditionDetails.defects.map((defect, index) => (
                  <li key={index}>{defect}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Analysis Metadata */}
      <div className="analysis-metadata">
        <div className="metadata-item">
          <span className="label">Analysis ID:</span>
          <span className="value">{result.requestId}</span>
        </div>
        <div className="metadata-item">
          <span className="label">Date:</span>
          <span className="value">{new Date(result.timestamp).toLocaleString()}</span>
        </div>
      </div>
      
      {/* Export and Share Actions */}
      <div className="actions">
        <div className="export-options">
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'pdf' | 'text')}
            className="export-format-select"
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="pdf">PDF</option>
          </select>
          <button 
            onClick={handleExport}
            className="export-btn"
          >
            Export Results
          </button>
        </div>
        
        <button 
          onClick={handleShare}
          className="share-btn"
        >
          Share Results
        </button>
        
        <button 
          onClick={handleCopyToClipboard}
          className="copy-btn"
        >
          Copy to Clipboard
        </button>
        
        {copySuccess && (
          <div className="copy-success-message">
            {copySuccess}
          </div>
        )}
      </div>
      
      {/* Share Modal */}
      {shareModalOpen && (
        <div className="share-modal">
          <div className="share-modal-content">
            <div className="share-modal-header">
              <h4>Share Analysis Results</h4>
              <button 
                onClick={() => setShareModalOpen(false)}
                className="close-modal-btn"
              >
                &times;
              </button>
            </div>
            <div className="share-modal-body">
              <div className="share-link">
                <input 
                  type="text" 
                  value={window.location.href} 
                  readOnly 
                  className="share-link-input"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopySuccess('Link copied!');
                    setTimeout(() => setCopySuccess(''), 3000);
                  }}
                  className="copy-link-btn"
                >
                  Copy
                </button>
              </div>
              <div className="share-options">
                <button className="share-option email">
                  <i className="share-icon email-icon"></i>
                  Email
                </button>
                <button className="share-option twitter">
                  <i className="share-icon twitter-icon"></i>
                  Twitter
                </button>
                <button className="share-option facebook">
                  <i className="share-icon facebook-icon"></i>
                  Facebook
                </button>
                <button className="share-option linkedin">
                  <i className="share-icon linkedin-icon"></i>
                  LinkedIn
                </button>
              </div>
              {copySuccess && (
                <div className="copy-success-message">
                  {copySuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to position the condition indicator on the meter
function getConditionPosition(condition: ConditionRating): number {
  switch (condition) {
    case ConditionRating.NEW:
      return 90;
    case ConditionRating.LIKE_NEW:
      return 70;
    case ConditionRating.GOOD:
      return 50;
    case ConditionRating.FAIR:
      return 30;
    case ConditionRating.POOR:
      return 10;
    default:
      return 50;
  }
}

export default ResultsDisplay;