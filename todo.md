# Project TODO

## Backend API Implementation
- [x] Add branches CRUD routes (list, create, update, delete)
- [x] Add customers CRUD routes (list, create, update, delete)
- [x] Add accounts CRUD routes (list, create, update, delete)
- [x] Add transactions routes (deposit, withdraw, transfer, history)
- [x] Add dashboard statistics route
- [x] Implement admin authentication via Manus OAuth

## Database Schema
- [x] Create branches table
- [x] Create customers table
- [x] Create accounts table
- [x] Create transactions table
- [x] Create transaction sequence table
- [x] Seed initial branch data

## Admin UI - Customers Module
- [x] Customer list page with search
- [x] Create customer form/dialog
- [x] Edit customer form/dialog
- [x] Delete customer confirmation
- [x] View customer details with account count and balance

## Admin UI - Accounts Module
- [x] Account list page with search
- [x] Create account form (select customer and branch)
- [x] View account transactions link
- [x] Toggle account status (active/closed)

## Admin UI - Transactions Module
- [x] Transaction history page with search
- [x] Deposit form/dialog
- [x] Withdrawal form/dialog
- [x] Internal transfer form/dialog
- [x] Transaction details in table view

## Admin UI - Branches Module
- [x] Branch list page
- [x] Create/edit branch form
- [x] Delete branch functionality
- [x] Seed default branches button

## Admin Dashboard
- [x] Dashboard with real statistics from database
- [x] Total customers, accounts, deposits display
- [x] Branch-wise balance breakdown
- [x] Today's transaction summary (deposits, withdrawals, transfers)
- [x] Quick action buttons

## Authentication & Navigation
- [x] Admin authentication via Manus OAuth
- [x] Dashboard layout with sidebar navigation
- [x] Protected routes for admin pages
- [x] Logout functionality
- [x] Connect landing page to admin dashboard


## Interbank Transfer Feature
- [x] Add Intrabank/Interbank subtabs to Transfer dialog
- [x] Create Instapay transfer form with bank dropdown
- [x] Add 5 Philippine banks to dropdown (BDO, BPI, Metrobank, UnionBank, Landbank)
- [x] Add recipient details fields (account number, account name)
- [x] Add transaction amount with ₱50,000 limit validation
- [x] Implement UI-only Instapay transfer (simulated)
