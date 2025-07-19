/**
 * Request Queue Middleware
 * This module provides middleware for handling request queuing
 * to manage multiple simultaneous requests efficiently
 */

// Simple in-memory queue implementation
class RequestQueue {
  constructor(concurrency = 2) {
    this.queue = [];
    this.processing = 0;
    this.maxConcurrent = concurrency;
  }

  /**
   * Add a request to the queue
   * @param {Function} task - Function that returns a promise
   * @returns {Promise} - Promise that resolves when the task completes
   */
  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject
      });
      this.processNext();
    });
  }

  /**
   * Process the next item in the queue if possible
   */
  processNext() {
    if (this.processing < this.maxConcurrent && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      this.processing++;

      Promise.resolve()
        .then(() => task())
        .then(result => {
          this.processing--;
          resolve(result);
          this.processNext();
        })
        .catch(error => {
          this.processing--;
          reject(error);
          this.processNext();
        });
    }
  }

  /**
   * Get the current queue length
   * @returns {number} - Number of items in the queue
   */
  get length() {
    return this.queue.length;
  }

  /**
   * Get the number of requests currently being processed
   * @returns {number} - Number of requests being processed
   */
  get activeCount() {
    return this.processing;
  }
}

// Create a queue instance for product analysis requests
const productAnalysisQueue = new RequestQueue(
  Number(process.env.PRODUCT_ANALYSIS_CONCURRENCY) || 2
);

/**
 * Middleware that queues requests for product analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const queueProductAnalysisRequest = (req, res, next) => {
  // Add queue position and estimated wait time to response headers
  const queuePosition = productAnalysisQueue.length;
  const estimatedWaitTime = queuePosition * 5; // Rough estimate: 5 seconds per request
  
  res.set('X-Queue-Position', queuePosition.toString());
  res.set('X-Estimated-Wait-Time', `${estimatedWaitTime}s`);
  
  // If queue is too long, return 429 Too Many Requests
  const maxQueueLength = Number(process.env.MAX_QUEUE_LENGTH) || 10;
  if (queuePosition >= maxQueueLength) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'QUEUE_FULL',
        message: 'Too many requests, please try again later',
        details: {
          queuePosition,
          estimatedWaitTime: `${estimatedWaitTime}s`,
          retryAfter: estimatedWaitTime
        }
      }
    });
  }

  // Store the original send function
  const originalSend = res.send;
  
  // Queue the actual request processing
  productAnalysisQueue.enqueue(() => {
    return new Promise((resolve) => {
      // Override res.send to resolve the promise when the response is sent
      res.send = function(body) {
        // Restore the original send function
        res.send = originalSend;
        // Call the original send function
        res.send(body);
        // Resolve the promise
        resolve();
        return res;
      };
      
      // Continue with the request
      next();
    });
  }).catch(error => {
    console.error('Error in request queue:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'QUEUE_ERROR',
          message: 'An error occurred while processing your request',
          details: process.env.NODE_ENV === 'development' ? { error: error.message } : undefined
        }
      });
    }
  });
};

export default {
  queueProductAnalysisRequest,
  productAnalysisQueue
};