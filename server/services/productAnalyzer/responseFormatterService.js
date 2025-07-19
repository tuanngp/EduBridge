/**
 * Response Formatter Service
 * This service formats analysis results for the frontend
 */

/**
 * Formats an analysis result for the frontend
 * @param {Object} analysis - The product analysis
 * @param {string} imageUrl - The image URL
 * @param {string} requestId - The request ID
 * @returns {Object} - The formatted analysis result
 */
export const formatAnalysisResult = (analysis, imageUrl, requestId) => {
  const timestamp = new Date().toISOString();
  
  return {
    requestId,
    timestamp,
    imageUrl,
    productInfo: {
      type: analysis.productInfo.type || 'Unknown Product',
      brand: analysis.productInfo.brand || null,
      model: analysis.productInfo.model || null,
      color: analysis.productInfo.color || null,
      materials: analysis.productInfo.materials || [],
      dimensions: analysis.productInfo.dimensions || null,
      features: analysis.productInfo.features || [],
      estimatedAge: analysis.productInfo.estimatedAge || null,
      certaintyScore: analysis.productInfo.certaintyScore || 50
    },
    conditionAssessment: {
      overallCondition: analysis.conditionAssessment.overallCondition || 'Unknown',
      conditionDetails: {
        wearSigns: analysis.conditionAssessment.conditionDetails.wearSigns || [],
        damages: analysis.conditionAssessment.conditionDetails.damages || [],
        defects: analysis.conditionAssessment.conditionDetails.defects || [],
        positiveAspects: analysis.conditionAssessment.conditionDetails.positiveAspects || []
      },
      conditionExplanation: analysis.conditionAssessment.conditionExplanation || 'No explanation available.',
      confidenceScore: analysis.conditionAssessment.confidenceScore || 50
    },
    summary: generateSummary(analysis)
  };
};

/**
 * Generates a summary of the analysis
 * @param {Object} analysis - The product analysis
 * @returns {string} - The summary
 */
export const generateSummary = (analysis) => {
  const productType = analysis.productInfo?.type || 'Unknown product';
  const brand = analysis.productInfo?.brand;
  const condition = analysis.conditionAssessment?.overallCondition || 'Unknown condition';
  const confidenceScore = analysis.conditionAssessment?.confidenceScore || 0;
  
  let summary = `Analyzed ${productType.toLowerCase()}`;
  
  if (brand) {
    summary += ` from ${brand}`;
  }
  
  summary += ` and determined it to be in ${condition.toLowerCase()} condition`;
  
  if (confidenceScore > 0) {
    summary += ` with ${confidenceScore}% confidence`;
  }
  
  // Add specific details if available
  const details = [];
  
  if (analysis.conditionAssessment?.conditionDetails?.positiveAspects?.length > 0) {
    details.push(`positive aspects: ${analysis.conditionAssessment.conditionDetails.positiveAspects.slice(0, 2).join(', ')}`);
  }
  
  if (analysis.conditionAssessment?.conditionDetails?.wearSigns?.length > 0) {
    details.push(`wear signs: ${analysis.conditionAssessment.conditionDetails.wearSigns.slice(0, 2).join(', ')}`);
  }
  
  if (analysis.conditionAssessment?.conditionDetails?.damages?.length > 0) {
    details.push(`damages: ${analysis.conditionAssessment.conditionDetails.damages.slice(0, 2).join(', ')}`);
  }
  
  if (details.length > 0) {
    summary += `. Key findings include ${details.join(' and ')}.`;
  } else {
    summary += '.';
  }
  
  return summary;
};