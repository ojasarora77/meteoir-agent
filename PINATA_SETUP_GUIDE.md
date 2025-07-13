# 📌 Pinata IPFS Setup Guide

## Overview
This guide will help you set up Pinata for IPFS storage in your Agentic Stablecoin project. Pinata provides a user-friendly interface and reliable infrastructure for IPFS.

---

## 🚀 Step 1: Create Pinata Account

### 1.1 Sign Up Process
1. **Visit Pinata**: Go to [https://pinata.cloud](https://pinata.cloud)
2. **Click "Get Started"**: Choose the free plan to start
3. **Fill Registration Form**:
   - Enter your email address
   - Create a strong password
   - Accept terms and conditions
4. **Verify Email**: Check your inbox and click the verification link
5. **Complete Profile**: Add your name and optional company information

### 1.2 Account Dashboard
Once logged in, you'll see:
- **Dashboard**: Overview of your usage and storage
- **Files**: Your uploaded files and folders
- **API Keys**: Where you'll generate access credentials
- **Billing**: Plan details and usage limits

---

## 🔑 Step 2: Generate API Credentials

### 2.1 Navigate to API Keys
1. **Login to Dashboard**: Access [app.pinata.cloud](https://app.pinata.cloud)
2. **Click "API Keys"**: Found in the left sidebar menu
3. **Click "New Key"**: Blue button in the top right

### 2.2 Configure API Key Permissions
**Select the following permissions:**
- ✅ **pinFileToIPFS** - Upload files to IPFS
- ✅ **pinJSONToIPFS** - Upload JSON data to IPFS
- ✅ **pinList** - List your pinned files
- ✅ **userPinnedDataTotal** - Get usage statistics
- ✅ **unpin** - Remove files from IPFS (optional)

### 2.3 Generate and Save Credentials
1. **Key Name**: Enter "Agentic-Stablecoin-Production"
2. **Click "Create Key"**: Generate your credentials
3. **Copy and Save Immediately**:
   ```
   API Key: [Your API Key - starts with your account ID]
   API Secret: [Long secret string]
   JWT Token: [Very long token starting with "eyJ"]
   ```

⚠️ **IMPORTANT**: Save these credentials immediately! The secret and JWT won't be shown again.

---

## ⚙️ Step 3: Configure Your Project

### 3.1 Update Environment Variables
Open `/packages/backend/.env` and update the Pinata configuration:

```bash
# IPFS Configuration (Pinata)
PINATA_API_KEY=your_actual_pinata_api_key_here
PINATA_SECRET_API_KEY=your_actual_pinata_secret_here
PINATA_JWT_TOKEN=your_actual_pinata_jwt_token_here
PINATA_GATEWAY_URL=REMOVED
```

### 3.2 Example Configuration
```bash
# Replace with your actual credentials
PINATA_API_KEY=REMOVED
PINATA_SECRET_API_KEY=REMOVED
PINATA_JWT_TOKEN=REMOVED
PINATA_GATEWAY_URL=REMOVED
```

---

## 🧪 Step 4: Test Your Setup

### 4.1 Backend Test
Run this from `/packages/backend/`:

```bash
# Test Pinata connection
npx ts-node -e "
import { PinataAdapter } from './src/adapters/pinata-adapter';
async function test() {
  const pinata = new PinataAdapter();
  const auth = await pinata.testAuthentication();
  console.log('Authentication:', auth);
  const stats = await pinata.getUsageStats();
  console.log('Usage Stats:', stats);
}
test().catch(console.error);
"
```

### 4.2 Expected Output
```
Authentication: { authenticated: true, user: 'Successfully authenticated' }
Usage Stats: { pinCount: 0, pinSize: 0, bandwidth: 0 }
```

### 4.3 Test File Upload
```bash
# Test file upload
npx ts-node -e "
import { PinataAdapter } from './src/adapters/pinata-adapter';
import fs from 'fs';
async function testUpload() {
  const pinata = new PinataAdapter();
  const testData = { message: 'Hello from Agentic Stablecoin!', timestamp: new Date() };
  const result = await pinata.pinJSON(testData, { name: 'Test Upload' });
  console.log('Upload Result:', result);
  console.log('Public URL:', pinata.getPublicUrl(result.ipfsHash));
}
testUpload().catch(console.error);
"
```

---

## 📊 Step 5: Understanding Pricing

### 5.1 Free Tier (Hobby Plan)
- **Storage**: 1 GB free
- **Bandwidth**: 1 GB free monthly
- **Requests**: 100 requests/second
- **Files**: Unlimited file count

### 5.2 Paid Plans
- **Picnic Plan**: $20/month
  - 1 GB storage + 1 GB bandwidth
  - Additional: $0.15/GB storage, $0.15/GB bandwidth
- **Roadtrip Plan**: $100/month
  - 10 GB storage + 10 GB bandwidth
  - Volume discounts available

### 5.3 Cost Estimation for Your Project
Our cost optimizer automatically calculates Pinata costs:
```typescript
const costEstimate = pinata.calculateStorageCost(fileSizeInBytes);
console.log(costEstimate);
// Output: { estimatedCost: 0.15, currency: 'USD', breakdown: {...} }
```

---

## 🔒 Step 6: Security Best Practices

### 6.1 API Key Management
- ✅ **Never commit API keys** to version control
- ✅ **Use environment variables** for all credentials
- ✅ **Rotate keys regularly** (quarterly recommended)
- ✅ **Use different keys** for development and production

### 6.2 Access Control
- ✅ **Minimal permissions**: Only grant necessary permissions
- ✅ **Key naming**: Use descriptive names for different environments
- ✅ **Monitor usage**: Check dashboard regularly for unusual activity

### 6.3 Backup Strategy
- ✅ **Document your keys**: Keep secure backups of credentials
- ✅ **Multiple keys**: Create backup keys for critical applications
- ✅ **Emergency access**: Ensure team access for key recovery

---

## 🛠️ Step 7: Integration Features

### 7.1 Available Operations
Your Pinata adapter supports:
- **File Upload**: `pinFile(buffer, filename, metadata)`
- **JSON Upload**: `pinJSON(data, metadata)`
- **File Retrieval**: `getFile(ipfsHash)`
- **JSON Retrieval**: `getJSON(ipfsHash)`
- **List Files**: `listPinnedFiles(options)`
- **Delete Files**: `unpinFile(ipfsHash)`
- **Usage Stats**: `getUsageStats()`

### 7.2 Example Usage in Your App
```typescript
import { PinataAdapter } from './adapters/pinata-adapter';

const pinata = new PinataAdapter();

// Upload user data
const userData = { userId: 'user123', preferences: {...} };
const result = await pinata.pinJSON(userData, {
  name: 'User Preferences',
  tags: ['user-data', 'preferences']
});

// Generate public URL
const publicUrl = pinata.getPublicUrl(result.ipfsHash);
console.log(`Data available at: ${publicUrl}`);
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Authentication Failed
```
Error: Pinata credentials not configured
```
**Solution**: Check that all three environment variables are set:
- `PINATA_API_KEY`
- `PINATA_SECRET_API_KEY` 
- `PINATA_JWT_TOKEN`

#### Issue 2: Upload Timeout
```
Error: timeout of 60000ms exceeded
```
**Solution**: Large files may timeout. Try:
- Reducing file size
- Splitting into chunks
- Increasing timeout in adapter

#### Issue 3: Rate Limiting
```
Error: Too Many Requests
```
**Solution**: Implement retry logic or upgrade your Pinata plan.

#### Issue 4: Invalid IPFS Hash
```
Error: Failed to retrieve file from IPFS: 404
```
**Solution**: Verify the IPFS hash is correct and the file was successfully pinned.

---

## 📈 Monitoring and Maintenance

### 7.1 Usage Monitoring
```typescript
// Check usage regularly
const stats = await pinata.getUsageStats();
console.log(`Files: ${stats.pinCount}, Storage: ${stats.pinSize} bytes`);
```

### 7.2 Health Checks
```typescript
// Include in your health check endpoint
const isHealthy = await pinata.testAuthentication();
```

### 7.3 Cleanup Tasks
```typescript
// List old files
const oldFiles = await pinata.listPinnedFiles({
  limit: 100,
  status: 'pinned'
});

// Unpin unused files to save costs
for (const file of oldFiles.rows) {
  if (shouldDelete(file)) {
    await pinata.unpinFile(file.ipfsHash);
  }
}
```

---

## ✅ Verification Checklist

- [ ] Pinata account created and verified
- [ ] API keys generated with correct permissions
- [ ] Environment variables configured in `.env`
- [ ] Authentication test passes
- [ ] Test file upload successful
- [ ] Public URL accessible
- [ ] Usage stats retrievable
- [ ] Integration working in your app

---

## 🎯 Next Steps

1. **Replace Placeholder Keys**: Update `.env` with your real Pinata credentials
2. **Test Integration**: Run the backend and test the IPFS storage endpoints
3. **Monitor Usage**: Keep an eye on your storage and bandwidth usage
4. **Scale Up**: Upgrade your Pinata plan when you exceed free tier limits

**🎉 Congratulations! Your Pinata IPFS integration is now ready for autonomous file storage in your Agentic Stablecoin system!**