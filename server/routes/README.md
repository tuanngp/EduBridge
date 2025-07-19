# API Routes Documentation

## Product Analyzer API

### POST /api/product-analyzer/analyze

Analyzes a product image to determine its condition and extract product information.

#### Request

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "options": {
    "detailLevel": "standard",
    "prioritizeCondition": true
  }
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| imageUrl | string | Yes | URL of the image to analyze |
| options | object | No | Analysis options |
| options.detailLevel | string | No | Level of detail for analysis: 'basic', 'standard', or 'detailed'. Default: 'standard' |
| options.prioritizeCondition | boolean | No | Whether to prioritize condition assessment over product details. Default: true |

#### Response

```json
{
  "success": true,
  "requestId": "pa-1626912345678-abc123def",
  "data": {
    "imageUrl": "https://example.com/image.jpg",
    "productInfo": {
      "type": "Smartphone",
      "brand": "Apple",
      "model": "iPhone 12",
      "color": "Blue",
      "materials": ["Glass", "Aluminum"],
      "dimensions": {
        "width": 71.5,
        "height": 146.7,
        "depth": 7.4,
        "unit": "mm"
      },
      "features": ["5G", "OLED display", "Dual camera"],
      "estimatedAge": "1-2 years",
      "certaintyScore": 85
    },
    "conditionAssessment": {
      "overallCondition": "Good",
      "conditionDetails": {
        "wearSigns": ["Minor scratches on screen", "Light wear on corners"],
        "damages": [],
        "defects": [],
        "positiveAspects": ["Screen intact", "No visible dents"]
      },
      "conditionExplanation": "The device shows signs of normal use with minor scratches on the screen and light wear on the corners. Overall, it's in good condition with no significant damage.",
      "confidenceScore": 78
    },
    "summary": "iPhone 12 in good condition with minor wear",
    "timing": {
      "total": "1250ms",
      "validation": "120ms",
      "analysis": "1130ms"
    }
  }
}
```

#### Error Responses

##### Missing Required Fields

```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELDS",
    "message": "Missing required fields: imageUrl",
    "details": {
      "missingFields": ["imageUrl"]
    }
  }
}
```

##### Invalid Field Types

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FIELD_TYPES",
    "message": "One or more fields have invalid types",
    "details": {
      "typeErrors": [
        {
          "field": "imageUrl",
          "expectedType": "string",
          "actualType": "number"
        }
      ]
    }
  }
}
```

##### Invalid Image URL

```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_URL",
    "message": "Invalid URL format",
    "details": {
      "imageUrl": "invalid-url"
    }
  }
}
```

##### Queue Full

```json
{
  "success": false,
  "error": {
    "code": "QUEUE_FULL",
    "message": "Too many requests, please try again later",
    "details": {
      "queuePosition": 10,
      "estimatedWaitTime": "50s",
      "retryAfter": 50
    }
  }
}
```

##### Server Error

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

#### Response Headers

| Header | Description |
|--------|-------------|
| X-Queue-Position | Position in the processing queue |
| X-Estimated-Wait-Time | Estimated wait time in seconds |

#### Notes

- The API uses a queuing system to handle multiple requests efficiently
- If the queue is full, the request will be rejected with a 429 status code
- The analysis may take several seconds to complete depending on the image size and complexity
- The confidence score indicates how certain the system is about the analysis results