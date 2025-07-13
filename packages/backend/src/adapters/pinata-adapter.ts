import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

/**
 * Pinata IPFS adapter for file storage and retrieval
 * Provides seamless integration with Pinata's IPFS gateway
 */
export class PinataAdapter {
  private apiKey: string;
  private secretApiKey: string;
  private jwtToken: string;
  private gatewayUrl: string;
  private baseUrl: string = 'https://api.pinata.cloud';

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || '';
    this.secretApiKey = process.env.PINATA_SECRET_API_KEY || '';
    this.jwtToken = process.env.PINATA_JWT_TOKEN || '';
    this.gatewayUrl = process.env.PINATA_GATEWAY_URL || 'REMOVED';

    if (!this.apiKey || !this.secretApiKey || !this.jwtToken) {
      throw new Error('Pinata credentials not configured. Please set PINATA_API_KEY, PINATA_SECRET_API_KEY, and PINATA_JWT_TOKEN');
    }
  }

  /**
   * Pin a file to IPFS via Pinata
   */
  async pinFile(
    fileBuffer: Buffer, 
    fileName: string, 
    metadata?: {
      name?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<{
    ipfsHash: string;
    pinSize: number;
    timestamp: string;
    isDuplicate: boolean;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);

      // Add metadata if provided
      if (metadata) {
        const pinataMetadata = {
          name: metadata.name || fileName,
          keyvalues: metadata.tags ? { tags: metadata.tags.join(',') } : undefined
        };
        formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      }

      // Pinata options
      const pinataOptions = {
        cidVersion: 1
      };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`,
            ...formData.getHeaders()
          },
          timeout: 60000, // 60 second timeout for large files
        }
      );

      return {
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        isDuplicate: response.data.isDuplicate || false
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Pinata file upload failed: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to pin file to IPFS: ${error}`);
    }
  }

  /**
   * Pin JSON data to IPFS via Pinata
   */
  async pinJSON(
    jsonData: any,
    metadata?: {
      name?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<{
    ipfsHash: string;
    pinSize: number;
    timestamp: string;
    isDuplicate: boolean;
  }> {
    try {
      const body = {
        pinataContent: jsonData,
        pinataMetadata: {
          name: metadata?.name || 'JSON Data',
          keyvalues: metadata?.tags ? { tags: metadata.tags.join(',') } : undefined
        },
        pinataOptions: {
          cidVersion: 1
        }
      };

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/pinning/pinJSONToIPFS`,
        body,
        {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
        }
      );

      return {
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        isDuplicate: response.data.isDuplicate || false
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Pinata JSON upload failed: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to pin JSON to IPFS: ${error}`);
    }
  }

  /**
   * Retrieve file from IPFS via Pinata gateway
   */
  async getFile(ipfsHash: string): Promise<Buffer> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.gatewayUrl}/ipfs/${ipfsHash}`,
        {
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to retrieve file from IPFS: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to retrieve file from IPFS: ${error}`);
    }
  }

  /**
   * Retrieve JSON data from IPFS via Pinata gateway
   */
  async getJSON(ipfsHash: string): Promise<any> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.gatewayUrl}/ipfs/${ipfsHash}`,
        {
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to retrieve JSON from IPFS: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to retrieve JSON from IPFS: ${error}`);
    }
  }

  /**
   * List all pinned files
   */
  async listPinnedFiles(options?: {
    limit?: number;
    offset?: number;
    status?: 'pinned' | 'unpinned';
    metadata?: { name?: string; tags?: string[] };
  }): Promise<{
    count: number;
    rows: Array<{
      ipfsHash: string;
      size: number;
      timestamp: string;
      metadata: any;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (options?.limit) params.append('pageLimit', options.limit.toString());
      if (options?.offset) params.append('pageOffset', options.offset.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.metadata?.name) params.append('metadata[name]', options.metadata.name);

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/data/pinList?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`
          },
          timeout: 15000,
        }
      );

      return {
        count: response.data.count,
        rows: response.data.rows.map((item: any) => ({
          ipfsHash: item.ipfs_pin_hash,
          size: item.size,
          timestamp: item.date_pinned,
          metadata: item.metadata
        }))
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to list pinned files: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to list pinned files: ${error}`);
    }
  }

  /**
   * Unpin a file from IPFS
   */
  async unpinFile(ipfsHash: string): Promise<boolean> {
    try {
      await axios.delete(
        `${this.baseUrl}/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`
          },
          timeout: 15000,
        }
      );

      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // File not found or already unpinned
          return false;
        }
        throw new Error(`Failed to unpin file: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to unpin file: ${error}`);
    }
  }

  /**
   * Test authentication and connection
   */
  async testAuthentication(): Promise<{
    authenticated: boolean;
    user?: string;
    plan?: string;
  }> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/data/testAuthentication`,
        {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`
          },
          timeout: 10000,
        }
      );

      return {
        authenticated: true,
        user: response.data.message
      };
    } catch (error) {
      return {
        authenticated: false
      };
    }
  }

  /**
   * Get account usage statistics
   */
  async getUsageStats(): Promise<{
    pinCount: number;
    pinSize: number;
    bandwidth: number;
  }> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/data/userPinnedDataTotal`,
        {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`
          },
          timeout: 10000,
        }
      );

      return {
        pinCount: response.data.pin_count,
        pinSize: response.data.pin_size_total,
        bandwidth: response.data.pin_size_with_replications_total
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get usage stats: ${error.response?.data?.error || error.message}`);
      }
      throw new Error(`Failed to get usage stats: ${error}`);
    }
  }

  /**
   * Generate a public gateway URL for an IPFS hash
   */
  getPublicUrl(ipfsHash: string): string {
    return `${this.gatewayUrl}/ipfs/${ipfsHash}`;
  }

  /**
   * Calculate estimated cost for storing data
   */
  calculateStorageCost(sizeInBytes: number): {
    estimatedCost: number;
    currency: string;
    breakdown: {
      storageCost: number;
      bandwidthCost: number;
    };
  } {
    // Pinata pricing (as of 2024)
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    
    // Basic plan: $20/month for 1GB storage + 1GB bandwidth
    // Additional storage: $0.15/GB/month
    // Additional bandwidth: $0.15/GB
    
    const baseStorageGB = 1;
    const baseMonthlyCost = 20;
    const additionalStorageCostPerGB = 0.15;
    const bandwidthCostPerGB = 0.15;
    
    let storageCost = 0;
    if (sizeInGB > baseStorageGB) {
      storageCost = (sizeInGB - baseStorageGB) * additionalStorageCostPerGB;
    }
    
    const bandwidthCost = sizeInGB * bandwidthCostPerGB;
    
    return {
      estimatedCost: storageCost + bandwidthCost,
      currency: 'USD',
      breakdown: {
        storageCost,
        bandwidthCost
      }
    };
  }
}

export default PinataAdapter;