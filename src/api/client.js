// Client API calls for GST Flow Demo

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const apiClient = {
  // Sync upload - blocks until complete or timeout
  async syncUpload(data) {
    console.log('API Client: Calling sync upload with data:', data);
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/api/sync/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const endTime = Date.now();
    const result = await response.json();
    console.log('API Client: Sync upload response:', result);
    return {
      ...result,
      status: response.status,
      success: response.ok,
      duration: endTime - startTime
    };
  },

  // Async upload - returns immediately with job ID
  async asyncUpload(data) {
    console.log('API Client: Calling async upload with data:', data);
    const response = await fetch(`${API_BASE}/api/async/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('API Client: Async upload response:', result);
    return {
      ...result,
      status: response.status,
      success: response.ok
    };
  },

  // Check job status (polling)
  async getJobStatus(jobId) {
    const response = await fetch(`${API_BASE}/api/async/status?jobId=${jobId}`);
    const result = await response.json();
    return {
      ...result,
      success: response.ok
    };
  },

  // Server-Sent Events for real-time updates
  subscribeToJobUpdates(jobId, onMessage, onError, onComplete) {
    const eventSource = new EventSource(
      `${API_BASE}/api/async/status?jobId=${jobId}&format=sse`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'close') {
          eventSource.close();
          if (onComplete) onComplete();
          return;
        }
        
        if (data.error) {
          if (onError) onError(data.error);
          return;
        }
        
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('SSE parse error:', error);
        if (onError) onError('Parse error');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      if (onError) onError('Connection error');
    };

    return eventSource;
  },

  // Run load simulation
  async runLoadTest(config) {
    const response = await fetch(`${API_BASE}/api/simulate/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    const result = await response.json();
    return {
      ...result,
      success: response.ok
    };
  }
};

// Polling utility for job status
export function pollJobStatus(jobId, interval = 1000, maxAttempts = 60) {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      attempts++;
      
      try {
        const result = await apiClient.getJobStatus(jobId);
        
        if (!result.success) {
          reject(new Error('Failed to get job status'));
          return;
        }
        
        const job = result.job;
        
        // Check if job is complete
        if (job.status === 'completed') {
          resolve(job);
          return;
        }
        
        if (job.status === 'failed') {
          reject(new Error(job.error || 'Job failed'));
          return;
        }
        
        // Continue polling
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        } else {
          reject(new Error('Polling timeout'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    poll();
  });
}
