import AWS from 'aws-sdk';
import { create as createIPFS, IPFSHTTPClient } from 'ipfs-http-client';
import Arweave from 'arweave';
import { ServiceProvider, PricingModel } from '../types';

export interface StorageResult {
  success: boolean;
  url?: string;
  hash?: string;
  size: number;
  cost: number;
  provider: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export interface StorageOptions {
  encryption?: boolean;
  publicAccess?: boolean;
  customMetadata?: Record<string, any>;
  expirationTime?: number; // seconds
  redundancy?: number; // number of copies
}

/**
 * AWS S3 Storage Adapter
 */
export class S3StorageAdapter {
  private s3: AWS.S3;
  private provider: ServiceProvider;
  private bucketName: string;

  constructor(provider: ServiceProvider, bucketName: string) {
    this.provider = provider;
    this.bucketName = bucketName;
    
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'REMOVED',
    });
  }

  async uploadFile(
    data: Buffer | string,
    fileName: string,
    options?: StorageOptions
  ): Promise<StorageResult> {
    try {
      const key = this.generateKey(fileName);
      const sizeInBytes = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
      
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: data,
        ContentType: this.getContentType(fileName),
        Metadata: options?.customMetadata || {},
      };

      // Set ACL based on public access
      if (options?.publicAccess) {
        uploadParams.ACL = 'public-read';
      }

      // Set server-side encryption
      if (options?.encryption) {
        uploadParams.ServerSideEncryption = 'AES256';
      }

      // Set expiration
      if (options?.expirationTime) {
        uploadParams.Expires = new Date(Date.now() + options.expirationTime * 1000);
      }

      const result = await this.s3.upload(uploadParams).promise();
      const cost = this.calculateCost(sizeInBytes, 'upload');

      return {
        success: true,
        url: result.Location,
        hash: result.ETag?.replace(/"/g, ''),
        size: sizeInBytes,
        cost,
        provider: this.provider.name,
        metadata: {
          bucket: this.bucketName,
          key: result.Key,
          etag: result.ETag,
        },
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async downloadFile(key: string): Promise<StorageResult> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      const result = await this.s3.getObject(params).promise();
      const sizeInBytes = result.ContentLength || 0;
      const cost = this.calculateCost(sizeInBytes, 'download');

      return {
        success: true,
        size: sizeInBytes,
        cost,
        provider: this.provider.name,
        metadata: {
          data: result.Body,
          contentType: result.ContentType,
          lastModified: result.LastModified,
          etag: result.ETag,
        },
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  async deleteFile(key: string): Promise<StorageResult> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      const cost = this.calculateCost(0, 'delete');

      return {
        success: true,
        size: 0,
        cost,
        provider: this.provider.name,
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      etag: string;
    }>;
    cost: number;
  }> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucketName,
        MaxKeys: maxKeys,
        Prefix: prefix,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      const cost = this.calculateCost(0, 'list');

      const files = (result.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!,
        etag: obj.ETag!.replace(/"/g, ''),
      }));

      return { files, cost };
    } catch (error) {
      throw new Error(`List files failed: ${error}`);
    }
  }

  calculateCost(sizeInBytes: number, operation: string): number {
    const pricing = this.provider.pricingModel;
    
    // AWS S3 pricing (simplified)
    const rates = {
      upload: 0.0004, // $0.0004 per 1,000 PUT requests
      download: 0.0004, // $0.0004 per 1,000 GET requests
      storage: 0.023, // $0.023 per GB per month
      delete: 0, // FREE
      list: 0.0005, // $0.0005 per 1,000 LIST requests
    };

    switch (operation) {
      case 'upload':
      case 'download':
      case 'list':
        return rates[operation as keyof typeof rates] / 1000;
      case 'storage':
        const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
        return sizeInGB * rates.storage / 30; // Daily rate
      default:
        return 0;
    }
  }

  private generateKey(fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    return `uploads/${timestamp}_${randomId}_${fileName}`;
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      txt: 'text/plain',
      json: 'application/json',
      csv: 'text/csv',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

/**
 * IPFS Storage Adapter
 */
export class IPFSStorageAdapter {
  private ipfs: IPFSHTTPClient;
  private provider: ServiceProvider;

  constructor(provider: ServiceProvider) {
    this.provider = provider;
    
    this.ipfs = createIPFS({
      url: process.env.IPFS_NODE_URL || 'https://ipfs.infura.io:5001',
      headers: {
        authorization: process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET
          ? `Basic ${Buffer.from(`${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`).toString('base64')}`
          : undefined,
      },
    });
  }

  async uploadFile(
    data: Buffer | string,
    fileName: string,
    options?: StorageOptions
  ): Promise<StorageResult> {
    try {
      const content = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const sizeInBytes = content.length;

      // Add file to IPFS
      const result = await this.ipfs.add({
        content,
        path: fileName,
      });

      const cost = this.calculateCost(sizeInBytes, 'upload');

      // Pin the file for persistence (if using a pinning service)
      if (options?.redundancy && options.redundancy > 1) {
        await this.ipfs.pin.add(result.cid);
      }

      return {
        success: true,
        url: `https://ipfs.io/ipfs/${result.cid}`,
        hash: result.cid.toString(),
        size: sizeInBytes,
        cost,
        provider: this.provider.name,
        metadata: {
          cid: result.cid.toString(),
          path: result.path,
          size: result.size,
        },
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'IPFS upload failed',
      };
    }
  }

  async downloadFile(cid: string): Promise<StorageResult> {
    try {
      const chunks = [];
      let totalSize = 0;

      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
        totalSize += chunk.length;
      }

      const data = Buffer.concat(chunks);
      const cost = this.calculateCost(totalSize, 'download');

      return {
        success: true,
        size: totalSize,
        cost,
        provider: this.provider.name,
        metadata: {
          data,
          cid,
        },
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'IPFS download failed',
      };
    }
  }

  async pinFile(cid: string): Promise<StorageResult> {
    try {
      await this.ipfs.pin.add(cid);
      const cost = this.calculateCost(0, 'pin');

      return {
        success: true,
        size: 0,
        cost,
        provider: this.provider.name,
        metadata: { cid, pinned: true },
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'IPFS pin failed',
      };
    }
  }

  async unpinFile(cid: string): Promise<StorageResult> {
    try {
      await this.ipfs.pin.rm(cid);
      const cost = this.calculateCost(0, 'unpin');

      return {
        success: true,
        size: 0,
        cost,
        provider: this.provider.name,
        metadata: { cid, pinned: false },
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'IPFS unpin failed',
      };
    }
  }

  calculateCost(sizeInBytes: number, operation: string): number {
    // IPFS pricing varies by provider
    // Using Infura IPFS pricing as example
    const rates = {
      upload: 0.0001, // $0.0001 per request
      download: 0.0001, // $0.0001 per request
      storage: 0.05, // $0.05 per GB per month
      pin: 0.0001,
      unpin: 0,
    };

    switch (operation) {
      case 'upload':
      case 'download':
      case 'pin':
        return rates[operation as keyof typeof rates];
      case 'storage':
        const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
        return sizeInGB * rates.storage / 30; // Daily rate
      default:
        return 0;
    }
  }
}

/**
 * Arweave Storage Adapter
 */
export class ArweaveStorageAdapter {
  private arweave: Arweave;
  private provider: ServiceProvider;
  private wallet: any;

  constructor(provider: ServiceProvider) {
    this.provider = provider;
    
    this.arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    });

    // Load wallet for transactions
    this.loadWallet();
  }

  private async loadWallet(): Promise<void> {
    try {
      if (process.env.ARWEAVE_WALLET_PATH) {
        const fs = await import('fs/promises');
        const walletData = await fs.readFile(process.env.ARWEAVE_WALLET_PATH, 'utf8');
        this.wallet = JSON.parse(walletData);
      }
    } catch (error) {
      console.warn('Failed to load Arweave wallet:', error);
    }
  }

  async uploadFile(
    data: Buffer | string,
    fileName: string,
    options?: StorageOptions
  ): Promise<StorageResult> {
    try {
      if (!this.wallet) {
        throw new Error('Arweave wallet not configured');
      }

      const content = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const sizeInBytes = content.length;

      // Create transaction
      const transaction = await this.arweave.createTransaction({
        data: content,
      }, this.wallet);

      // Add tags
      transaction.addTag('Content-Type', this.getContentType(fileName));
      transaction.addTag('File-Name', fileName);
      
      if (options?.customMetadata) {
        Object.entries(options.customMetadata).forEach(([key, value]) => {
          transaction.addTag(key, value.toString());
        });
      }

      // Sign transaction
      await this.arweave.transactions.sign(transaction, this.wallet);

      // Get cost estimate
      const cost = await this.calculateCost(sizeInBytes, 'upload');

      // Post transaction
      const response = await this.arweave.transactions.post(transaction);
      
      if (response.status === 200) {
        return {
          success: true,
          url: `https://arweave.net/${transaction.id}`,
          hash: transaction.id,
          size: sizeInBytes,
          cost,
          provider: this.provider.name,
          metadata: {
            transactionId: transaction.id,
            blockHeight: transaction.anchor,
            tags: transaction.tags,
          },
        };
      } else {
        throw new Error(`Arweave upload failed with status ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'Arweave upload failed',
      };
    }
  }

  async downloadFile(transactionId: string): Promise<StorageResult> {
    try {
      const response = await this.arweave.transactions.getData(transactionId, {
        decode: true,
        string: false,
      });

      const data = Buffer.from(response as ArrayBuffer);
      const sizeInBytes = data.length;
      const cost = this.calculateCostSync(sizeInBytes, 'download');

      return {
        success: true,
        size: sizeInBytes,
        cost,
        provider: this.provider.name,
        metadata: {
          data,
          transactionId,
        },
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        cost: 0,
        provider: this.provider.name,
        errorMessage: error instanceof Error ? error.message : 'Arweave download failed',
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<{
    status: string;
    confirmations: number;
  }> {
    try {
      const status = await this.arweave.transactions.getStatus(transactionId);
      
      return {
        status: status.status === 200 ? 'confirmed' : 'pending',
        confirmations: status.confirmed?.number_of_confirmations || 0,
      };
    } catch (error) {
      return {
        status: 'unknown',
        confirmations: 0,
      };
    }
  }

  async calculateCost(sizeInBytes: number, operation: string): Promise<number> {
    try {
      if (operation === 'upload') {
        // Get current price per byte from Arweave
        const price = await this.arweave.transactions.getPrice(sizeInBytes);
        const arPrice = this.arweave.ar.winstonToAr(price);
        
        // Convert AR to USD (simplified - in real app, get current AR/USD rate)
        const arToUsd = 25; // Approximate AR price in USD
        return parseFloat(arPrice) * arToUsd;
      }
      
      return this.calculateCostSync(sizeInBytes, operation);
    } catch (error) {
      return this.calculateCostSync(sizeInBytes, operation);
    }
  }

  private calculateCostSync(sizeInBytes: number, operation: string): number {
    // Fallback static pricing
    const rates = {
      upload: 0.000001, // Very rough estimate per byte
      download: 0, // Downloads are free on Arweave
    };

    switch (operation) {
      case 'upload':
        return sizeInBytes * rates.upload;
      case 'download':
        return 0;
      default:
        return 0;
    }
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      txt: 'text/plain',
      json: 'application/json',
      csv: 'text/csv',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

/**
 * Cloud Storage Manager - Handles multiple storage providers
 */
export class CloudStorageManager {
  private providers: Map<string, S3StorageAdapter | IPFSStorageAdapter | ArweaveStorageAdapter> = new Map();

  addProvider(id: string, adapter: S3StorageAdapter | IPFSStorageAdapter | ArweaveStorageAdapter): void {
    this.providers.set(id, adapter);
  }

  async uploadWithRedundancy(
    data: Buffer | string,
    fileName: string,
    providerIds: string[],
    options?: StorageOptions
  ): Promise<StorageResult[]> {
    const results: StorageResult[] = [];

    for (const providerId of providerIds) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        results.push({
          success: false,
          size: 0,
          cost: 0,
          provider: providerId,
          errorMessage: 'Provider not found',
        });
        continue;
      }

      try {
        const result = await provider.uploadFile(data, fileName, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          size: 0,
          cost: 0,
          provider: providerId,
          errorMessage: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    return results;
  }

  async downloadWithFallback(
    fileIdentifiers: Array<{ providerId: string; identifier: string }>
  ): Promise<StorageResult> {
    for (const { providerId, identifier } of fileIdentifiers) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        const result = await provider.downloadFile(identifier);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn(`Provider ${providerId} failed, trying next...`);
        continue;
      }
    }

    return {
      success: false,
      size: 0,
      cost: 0,
      provider: 'none',
      errorMessage: 'All providers failed',
    };
  }

  async compareProviderCosts(
    sizeInBytes: number,
    operation: string
  ): Promise<Array<{
    providerId: string;
    cost: number;
    features: string[];
  }>> {
    const comparisons = [];

    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const cost = provider.calculateCost ? 
          provider.calculateCost(sizeInBytes, operation) : 
          await (provider as any).calculateCost(sizeInBytes, operation);

        const features = this.getProviderFeatures(providerId);
        
        comparisons.push({
          providerId,
          cost,
          features,
        });
      } catch (error) {
        console.warn(`Failed to get cost for provider ${providerId}:`, error);
      }
    }

    return comparisons.sort((a, b) => a.cost - b.cost);
  }

  private getProviderFeatures(providerId: string): string[] {
    const features: Record<string, string[]> = {
      s3: ['Versioning', 'Encryption', 'CDN Integration', 'High Availability'],
      ipfs: ['Decentralized', 'Content Addressing', 'Peer-to-Peer', 'Censorship Resistant'],
      arweave: ['Permanent Storage', 'Blockchain Based', 'Pay Once Store Forever', 'Immutable'],
    };

    return features[providerId] || [];
  }
}