# Secbank Core Banking System - REST API Design

## Overview

This document outlines the REST API endpoints for the Secbank Core Banking System. These APIs enable external systems to integrate with the CBS for customer management, account operations, and transaction processing.

## Authentication

All API requests require authentication via API key passed in the `X-API-Key` header.

```
X-API-Key: your-api-key-here
```

API keys are managed by system administrators and can be created/revoked through the admin dashboard.

## Base URL

```
Production: https://your-domain.com/api/v1
Development: http://localhost:3000/api/v1
```

## Response Format

All responses follow a consistent JSON structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing API key |
| FORBIDDEN | 403 | API key lacks required permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request parameters |
| INSUFFICIENT_BALANCE | 400 | Account has insufficient funds |
| ACCOUNT_CLOSED | 400 | Account is closed |
| INTERNAL_ERROR | 500 | Internal server error |

---

## Branches API

### List All Branches
```
GET /api/v1/branches
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "branchCode": "001",
      "branchName": "Main Branch",
      "address": "123 Main Street",
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

### Get Branch by ID
```
GET /api/v1/branches/:id
```

### Create Branch
```
POST /api/v1/branches
Content-Type: application/json

{
  "branchCode": "006",
  "branchName": "New Branch",
  "address": "456 New Street"
}
```

### Update Branch
```
PUT /api/v1/branches/:id
Content-Type: application/json

{
  "branchName": "Updated Branch Name",
  "address": "789 Updated Street"
}
```

### Delete Branch
```
DELETE /api/v1/branches/:id
```

---

## Customers API

### List All Customers
```
GET /api/v1/customers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name, email, or phone |
| limit | number | Number of results (default: 50) |
| offset | number | Pagination offset (default: 0) |

### Get Customer by ID
```
GET /api/v1/customers/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+639123456789",
    "address": "123 Customer Street",
    "dateOfBirth": "1990-01-15",
    "createdAt": "2026-01-15T00:00:00.000Z",
    "accounts": [
      {
        "id": 1,
        "accountNumber": "001-0000001",
        "balance": 50000.00,
        "status": "active"
      }
    ]
  }
}
```

### Create Customer
```
POST /api/v1/customers
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+639123456789",
  "address": "123 Customer Street",
  "dateOfBirth": "1990-01-15"
}
```

### Update Customer
```
PUT /api/v1/customers/:id
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

### Delete Customer
```
DELETE /api/v1/customers/:id
```

---

## Accounts API

### List All Accounts
```
GET /api/v1/accounts
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| customerId | number | Filter by customer ID |
| branchId | number | Filter by branch ID |
| status | string | Filter by status (active/closed) |
| limit | number | Number of results (default: 50) |
| offset | number | Pagination offset (default: 0) |

### Get Account by ID
```
GET /api/v1/accounts/:id
```

### Get Account by Account Number
```
GET /api/v1/accounts/number/:accountNumber
```

### Create Account
```
POST /api/v1/accounts
Content-Type: application/json

{
  "customerId": 1,
  "branchId": 1,
  "accountType": "savings",
  "initialDeposit": 1000.00
}
```

### Update Account Status
```
PUT /api/v1/accounts/:id/status
Content-Type: application/json

{
  "status": "closed"
}
```

### Get Account Balance
```
GET /api/v1/accounts/:id/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountNumber": "001-0000001",
    "balance": 50000.00,
    "availableBalance": 50000.00,
    "currency": "PHP"
  }
}
```

### Get Account Transactions
```
GET /api/v1/accounts/:id/transactions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Filter from date (YYYY-MM-DD) |
| endDate | string | Filter to date (YYYY-MM-DD) |
| type | string | Filter by type (deposit/withdrawal/transfer) |
| limit | number | Number of results (default: 50) |
| offset | number | Pagination offset (default: 0) |

---

## Transactions API

### List All Transactions
```
GET /api/v1/transactions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| accountId | number | Filter by account ID |
| type | string | Filter by type (deposit/withdrawal/transfer) |
| startDate | string | Filter from date (YYYY-MM-DD) |
| endDate | string | Filter to date (YYYY-MM-DD) |
| limit | number | Number of results (default: 50) |
| offset | number | Pagination offset (default: 0) |

### Get Transaction by Reference Number
```
GET /api/v1/transactions/:referenceNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "referenceNumber": "TXN20260115001",
    "type": "deposit",
    "amount": 5000.00,
    "balanceBefore": 45000.00,
    "balanceAfter": 50000.00,
    "description": "Cash deposit",
    "accountNumber": "001-0000001",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

### Create Deposit
```
POST /api/v1/transactions/deposit
Content-Type: application/json

{
  "accountNumber": "001-0000001",
  "amount": 5000.00,
  "description": "Cash deposit"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "TXN20260115001",
    "type": "deposit",
    "amount": 5000.00,
    "newBalance": 55000.00
  },
  "message": "Deposit successful"
}
```

### Create Withdrawal
```
POST /api/v1/transactions/withdrawal
Content-Type: application/json

{
  "accountNumber": "001-0000001",
  "amount": 2000.00,
  "description": "Cash withdrawal"
}
```

### Create Internal Transfer
```
POST /api/v1/transactions/transfer
Content-Type: application/json

{
  "sourceAccountNumber": "001-0000001",
  "destinationAccountNumber": "001-0000002",
  "amount": 1000.00,
  "description": "Fund transfer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "TXN20260115002",
    "type": "transfer",
    "amount": 1000.00,
    "sourceAccount": {
      "accountNumber": "001-0000001",
      "newBalance": 49000.00
    },
    "destinationAccount": {
      "accountNumber": "001-0000002",
      "newBalance": 11000.00
    }
  },
  "message": "Transfer successful"
}
```

---

## Instapay API (Interbank Transfers)

### Initiate Instapay Transfer
```
POST /api/v1/instapay/send
Content-Type: application/json

{
  "sourceAccountNumber": "001-0000001",
  "destinationBank": "BDO",
  "destinationAccountNumber": "1234567890",
  "destinationAccountName": "Juan Dela Cruz",
  "amount": 5000.00,
  "description": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "IP20260115001",
    "status": "PENDING",
    "amount": 5000.00,
    "fee": 0.00,
    "totalAmount": 5000.00,
    "destinationBank": "BDO",
    "destinationAccountNumber": "1234567890",
    "destinationAccountName": "Juan Dela Cruz"
  },
  "message": "Instapay transfer initiated"
}
```

### Get Instapay Transaction Status
```
GET /api/v1/instapay/status/:referenceNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "IP20260115001",
    "status": "SUCCESS",
    "amount": 5000.00,
    "destinationBank": "BDO",
    "destinationAccountNumber": "1234567890",
    "destinationAccountName": "Juan Dela Cruz",
    "switchReferenceNumber": "SWITCH123456",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "completedAt": "2026-01-15T10:30:05.000Z"
  }
}
```

### Instapay Callback (For Switch Integration)
```
POST /api/v1/instapay/callback
Content-Type: application/json
X-Switch-Signature: sha256=...

{
  "referenceNumber": "IP20260115001",
  "status": "SUCCESS",
  "switchReferenceNumber": "SWITCH123456",
  "message": "Transaction completed successfully"
}
```

---

## Dashboard API

### Get Dashboard Statistics
```
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
    "todayDeposits": 50000.00,
    "todayWithdrawals": 25000.00,
    "todayTransfers": 15000.00,
    "branchBalances": [
      {
        "branchName": "Main Branch",
        "totalBalance": 2500000.00
      }
    ]
  }
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

| Endpoint Type | Rate Limit |
|---------------|------------|
| Read (GET) | 100 requests/minute |
| Write (POST/PUT/DELETE) | 30 requests/minute |
| Transactions | 10 requests/minute |

When rate limited, the API returns HTTP 429 with a `Retry-After` header.

---

## Webhooks (Optional)

External systems can register webhooks to receive real-time notifications:

```
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://your-system.com/webhook",
  "events": ["transaction.created", "account.status_changed"],
  "secret": "your-webhook-secret"
}
```

**Webhook Events:**
- `transaction.created` - New transaction processed
- `transaction.failed` - Transaction failed
- `account.created` - New account opened
- `account.status_changed` - Account status changed
- `instapay.completed` - Instapay transfer completed
- `instapay.failed` - Instapay transfer failed
