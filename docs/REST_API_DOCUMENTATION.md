# Secbank Core Banking System - REST API Documentation

## Overview

The Secbank REST API provides programmatic access to core banking functionality for external system integration. All endpoints are available under the `/api/v1` base path.

**Base URL:** `https://your-domain.com/api/v1`

---

## Authentication

All API requests require authentication using an API key. Include your API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: sb_your_api_key_here" https://your-domain.com/api/v1/branches
```

### API Key Permissions

| Permission | Description |
|------------|-------------|
| `read` | Read-only access to all resources |
| `write` | Read and write access (create, update) |
| `admin` | Full access including delete operations and API key management |

### Obtaining an API Key

API keys are created by administrators through the API key management endpoints or the admin dashboard. When a key is created, the full key is shown **only once** - store it securely.

---

## Response Format

All responses follow a consistent JSON structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | API key lacks required permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `INSUFFICIENT_BALANCE` | 400 | Account has insufficient funds |
| `ACCOUNT_CLOSED` | 400 | Operation not allowed on closed account |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Branches

### List All Branches
```http
GET /api/v1/branches
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "001",
      "name": "Main Branch",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Branch by ID
```http
GET /api/v1/branches/:id
```

### Create Branch
```http
POST /api/v1/branches
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "code": "006",
  "name": "New Branch"
}
```

### Update Branch
```http
PUT /api/v1/branches/:id
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "name": "Updated Branch Name"
}
```

### Delete Branch
```http
DELETE /api/v1/branches/:id
```
**Permission:** `admin`

---

## Customers

### List All Customers
```http
GET /api/v1/customers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Filter by customer name |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Customer by ID
```http
GET /api/v1/customers/:id
```

Returns customer details with their associated accounts.

### Create Customer
```http
POST /api/v1/customers
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "name": "Jane Smith"
}
```

### Update Customer
```http
PUT /api/v1/customers/:id
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "name": "Jane Smith-Johnson"
}
```

### Delete Customer
```http
DELETE /api/v1/customers/:id
```
**Permission:** `admin`

---

## Accounts

### List All Accounts
```http
GET /api/v1/accounts
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `customerId` | number | Filter by customer ID |
| `branchCode` | string | Filter by branch code |
| `status` | string | Filter by status (active/closed) |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

### Get Account by ID
```http
GET /api/v1/accounts/:id
```

### Get Account by Account Number
```http
GET /api/v1/accounts/number/:accountNumber
```

### Get Account Balance
```http
GET /api/v1/accounts/:id/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountNumber": "0010000001",
    "balance": 50000.00,
    "availableBalance": 50000.00,
    "currency": "PHP"
  }
}
```

### Get Account Transactions
```http
GET /api/v1/accounts/:id/transactions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

### Create Account
```http
POST /api/v1/accounts
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "customerId": 1,
  "branchCode": "001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "accountNumber": "0010000005",
    "customerId": 1,
    "branchCode": "001",
    "balance": "0.00",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Account created successfully"
}
```

### Update Account Status
```http
PUT /api/v1/accounts/:id/status
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "status": "closed"
}
```

---

## Transactions

### List All Transactions
```http
GET /api/v1/transactions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `accountId` | number | Filter by account ID |
| `type` | string | Filter by type (DEPOSIT, WITHDRAWAL, INTERNAL_TRANSFER, INSTAPAY) |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

### Get Transaction by Reference Number
```http
GET /api/v1/transactions/:referenceNumber
```

### Create Deposit
```http
POST /api/v1/transactions/deposit
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "accountNumber": "0010000001",
  "amount": 10000.00,
  "description": "Cash deposit"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "TXN20240115001234",
    "type": "DEPOSIT",
    "amount": 10000.00,
    "newBalance": 60000.00
  },
  "message": "Deposit successful"
}
```

### Create Withdrawal
```http
POST /api/v1/transactions/withdrawal
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "accountNumber": "0010000001",
  "amount": 5000.00,
  "description": "ATM withdrawal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "TXN20240115001235",
    "type": "WITHDRAWAL",
    "amount": 5000.00,
    "newBalance": 55000.00
  },
  "message": "Withdrawal successful"
}
```

### Create Internal Transfer
```http
POST /api/v1/transactions/transfer
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "sourceAccountNumber": "0010000001",
  "destinationAccountNumber": "0020000002",
  "amount": 15000.00,
  "description": "Fund transfer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "TXN20240115001236",
    "type": "INTERNAL_TRANSFER",
    "amount": 15000.00,
    "sourceAccount": {
      "accountNumber": "0010000001",
      "newBalance": 40000.00
    },
    "destinationAccount": {
      "accountNumber": "0020000002",
      "newBalance": 25000.00
    }
  },
  "message": "Transfer successful"
}
```

---

## Instapay (Interbank Transfers)

### Initiate Instapay Transfer
```http
POST /api/v1/instapay/send
```
**Permission:** `write` or `admin`

**Request Body:**
```json
{
  "sourceAccountNumber": "0010000001",
  "destinationBank": "BDO",
  "destinationAccountNumber": "1234567890",
  "destinationAccountName": "Juan Dela Cruz",
  "amount": 25000.00
}
```

**Supported Banks:**
- BDO
- BPI
- Metrobank
- UnionBank
- Landbank

**Limits:**
- Minimum: ₱1.00
- Maximum: ₱50,000.00 per transaction
- Fee: Free

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "TXN20240115001237",
    "status": "PENDING",
    "amount": 25000.00,
    "fee": 0,
    "totalAmount": 25000.00,
    "destinationBank": "BDO",
    "destinationAccountNumber": "1234567890",
    "destinationAccountName": "Juan Dela Cruz",
    "sourceAccountNumber": "0010000001"
  },
  "message": "Instapay transfer initiated"
}
```

### Get Instapay Transaction Status
```http
GET /api/v1/instapay/status/:referenceNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "referenceNumber": "TXN20240115001237",
    "sourceAccountId": 1,
    "sourceAccountNumber": "0010000001",
    "bankName": "BDO",
    "bankCode": "BDO",
    "accountNumber": "1234567890",
    "accountName": "Juan Dela Cruz",
    "amount": "25000.00",
    "fee": "0.00",
    "status": "SUCCESS",
    "switchReferenceNumber": "INSTAPAY123456",
    "errorMessage": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:05.000Z"
  }
}
```

### Instapay Callback (For Switch Integration)
```http
POST /api/v1/instapay/callback
```

This endpoint is called by the switch to update transaction status.

**Request Body:**
```json
{
  "referenceNumber": "TXN20240115001237",
  "status": "SUCCESS",
  "switchReferenceNumber": "INSTAPAY123456",
  "message": "Transaction completed successfully"
}
```

**Status Values:**
- `PENDING` - Transaction is being processed
- `SUCCESS` - Transaction completed successfully
- `FAILED` - Transaction failed (funds will be reversed)

---

## Dashboard

### Get Dashboard Statistics
```http
GET /api/v1/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 150,
    "totalAccounts": 200,
    "totalDeposits": 5000000.00,
    "branchBalances": [
      {
        "branchCode": "001",
        "branchName": "Main Branch",
        "totalBalance": 2500000.00
      }
    ],
    "todayStats": {
      "deposits": 50000.00,
      "withdrawals": 25000.00,
      "transfers": 30000.00
    }
  }
}
```

---

## API Key Management

### List API Keys
```http
GET /api/v1/api-keys
```
**Permission:** `admin`

Returns a list of all API keys (without the actual key values).

### Create API Key
```http
POST /api/v1/api-keys
```
**Permission:** `admin`

**Request Body:**
```json
{
  "name": "External System Integration",
  "description": "API key for ERP integration",
  "permissions": "write",
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "sb_a1b2c3d4e5f6...",
    "keyPrefix": "sb_a1b2c3d4",
    "name": "External System Integration",
    "permissions": "write"
  },
  "message": "API key created. Save the key now - it won't be shown again!"
}
```

> ⚠️ **Important:** The full API key is only returned once during creation. Store it securely!

### Revoke API Key
```http
DELETE /api/v1/api-keys/:id
```
**Permission:** `admin`

---

## Rate Limiting

Currently, there are no rate limits enforced. However, we recommend:
- Maximum 100 requests per minute for read operations
- Maximum 30 requests per minute for write operations

---

## Webhooks (Coming Soon)

Future versions will support webhooks for:
- Transaction notifications
- Account status changes
- Instapay status updates

---

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://your-domain.com/api/v1',
  headers: {
    'X-API-Key': 'sb_your_api_key_here',
    'Content-Type': 'application/json'
  }
});

// Get all customers
const customers = await api.get('/customers');

// Create a deposit
const deposit = await api.post('/transactions/deposit', {
  accountNumber: '0010000001',
  amount: 10000,
  description: 'API deposit'
});

// Initiate Instapay transfer
const instapay = await api.post('/instapay/send', {
  sourceAccountNumber: '0010000001',
  destinationBank: 'BDO',
  destinationAccountNumber: '1234567890',
  destinationAccountName: 'Juan Dela Cruz',
  amount: 5000
});
```

### Python
```python
import requests

API_BASE = 'https://your-domain.com/api/v1'
API_KEY = 'sb_your_api_key_here'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Get all branches
response = requests.get(f'{API_BASE}/branches', headers=headers)
branches = response.json()

# Create a withdrawal
response = requests.post(
    f'{API_BASE}/transactions/withdrawal',
    headers=headers,
    json={
        'accountNumber': '0010000001',
        'amount': 5000,
        'description': 'API withdrawal'
    }
)
```

### cURL
```bash
# Get account balance
curl -X GET "https://your-domain.com/api/v1/accounts/1/balance" \
  -H "X-API-Key: sb_your_api_key_here"

# Create internal transfer
curl -X POST "https://your-domain.com/api/v1/transactions/transfer" \
  -H "X-API-Key: sb_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountNumber": "0010000001",
    "destinationAccountNumber": "0020000002",
    "amount": 15000,
    "description": "Fund transfer via API"
  }'
```

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Branches, Customers, Accounts, Transactions CRUD
- Instapay integration endpoints
- API key authentication
- Dashboard statistics

---

## Support

For API support or to report issues, please contact:
- Email: support@secbank.com
- Documentation: https://docs.secbank.com
