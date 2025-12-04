export class ApiClient {
  async testConnection(): Promise<{ message: string; timestamp: string }> {
    const response = await fetch('/api/hello');
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export const apiClient = new ApiClient();

