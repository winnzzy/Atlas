const fs = require('fs');
const path = require('path');

const schema = `// ============================================================
// Atlas - Complete Prisma Schema
// Generated from: docs/database/Database-Design-Specification.md
// ============================================================

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS - Authentication Domain
// ============================================================

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
  CLOSED
}

enum KycStatus {
  NONE
  PENDING
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum KycLevel {
  LEVEL_0
  LEVEL_1
  LEVEL_2
  LEVEL_3
}

enum IdDocumentType {
  DRIVERS_LICENSE
  PASSPORT
  STATE_ID
}

enum AddressType {
  HOME
  MAILING
  BUSINESS
}

// ============================================================
// ENUMS - Account Domain
// ============================================================

enum AccountStatus {
  ACTIVE
  FROZEN
  DORMANT
  CLOSED
  PENDING
}

enum AccountType {
  CHECKING
  SAVINGS
}

enum FreezeReason {
  SUSPICIOUS_ACTIVITY
  COURT_ORDER
  KYC_FAILURE
  FRAUD
  MANUAL
  REGULATORY
}

enum ClosureReason {
  USER_REQUEST
  COMPLIANCE
  FRAUD
  INACTIVITY
  DEATH
}

// ============================================================
// ENUMS - Transaction Domain
// ============================================================

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  TRANSFER_IN
  TRANSFER_OUT
  FEE
  INTEREST
  REFUND
  ADJUSTMENT
  LOAN_DISBURSEMENT
  LOAN_PAYMENT
  CARD_PURCHASE
  CARD_REFUND
  ATM_WITHDRAWAL
  ACH_DEPOSIT
  ACH_WITHDRAWAL
  WIRE_INCOMING
  WIRE_OUTGOING
  CRYPTO_DEPOSIT
  CRYPTO_WITHDRAWAL
  CRYPTO_BUY
  CRYPTO_SELL
  INVESTMENT_BUY
  INVESTMENT_SELL
  DIVIDEND
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  REVERSED
  ON_HOLD
}

// ============================================================
// ENUMS - Transfer Domain
// ============================================================

enum TransferType {
  INTERNAL
  ACH
  DOMESTIC_WIRE
  INTERNATIONAL_WIRE
}

enum TransferStatus {
  DRAFT
  PENDING_REVIEW
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  RETURNED
}

enum AchClass {
  WEB
  CCD
  PPD
  TEL
}

// ============================================================
// ENUMS - Card Domain
// ============================================================

enum CardStatus {
  ACTIVE
  INACTIVE
  FROZEN
  CLOSED
  PENDING_ACTIVATION
  LOST
  STOLEN
}

enum CardType {
  VIRTUAL
  PHYSICAL
}

enum CardNetwork {
  VISA
  MASTERCARD
}

enum CardSpendingCategory {
  GENERAL
  TRAVEL
  DINING
  GROCERIES
  GAS
}

enum CardTransactionType {
  PURCHASE
  ATM_WITHDRAWAL
  REFUND
  REVERSAL
  PRE_AUTH
  RECURRING
}

enum CardTransactionStatus {
  PENDING
  COMPLETED
  DECLINED
  REVERSED
  REFUNDED
}

enum DeclineReason {
  INSUFFICIENT_FUNDS
  CARD_FROZEN
  EXCEEDS_LIMIT
  SUSPICIOUS_ACTIVITY
  INVALID_PIN
  EXPIRED_CARD
  INVALID_CVV
  BLOCKED_MERCHANT
  NETWORK_ERROR
  OTHER
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  PROVISIONAL_CREDIT
  RESOLVED_FAVORABLE
  RESOLVED_UNFAVORABLE
  ESCALATED
  CLOSED
}

// ============================================================
// ENUMS - Crypto Domain
// ============================================================

enum CryptoWalletStatus {
  ACTIVE
  FROZEN
  CLOSED
}

enum CryptoDepositStatus {
  PENDING
  CONFIRMING
  COMPLETED
  FAILED
  EXPIRED
}

enum CryptoWithdrawalStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum CryptoTradeStatus {
  PENDING
  EXECUTED
  FAILED
  CANCELLED
}

enum BlockchainNetwork {
  BITCOIN
  ETHEREUM
  POLYGON
  SOLANA
  TRON
  BNB_CHAIN
}

// ============================================================
// ENUMS - Investment Domain
// ============================================================

enum InvestmentAccountStatus {
  ACTIVE
  FROZEN
  CLOSED
  PENDING
}

enum InvestmentOrderSide {
  BUY
  SELL
}

enum InvestmentOrderType {
  MARKET
  LIMIT
  STOP
  STOP_LIMIT
}

enum InvestmentOrderStatus {
  PENDING
  FILLED
  PARTIALLY_FILLED
  CANCELLED
  REJECTED
  EXPIRED
}

enum InvestmentAssetType {
  STOCK
  ETF
  MUTUAL_FUND
  BOND
  CRYPTO
}

// ============================================================
// ENUMS - Loan Domain
// ============================================================

enum LoanStatus {
  ACTIVE
  PAID_OFF
  DEFAULTED
  CHARGED_OFF
  IN_COLLECTIONS
}

enum LoanType {
  PERSONAL
  LINE_OF_CREDIT
}

enum LoanApplicationStatus {
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  DENIED
  WITHDRAWN
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  LATE
}

enum EmploymentStatus {
  FULL_TIME
  PART_TIME
  SELF_EMPLOYED
  RETIRED
  OTHER
}

enum DocumentType {
  ID_VERIFICATION
  INCOME_PROOF
  EMPLOYMENT_VERIFICATION
  TAX_RETURN
  BANK_STATEMENT
  OTHER
}

enum DocumentStatus {
  UPLOADED
  REVIEWED
  APPROVED
  REJECTED
}

// ============================================================
// ENUMS - Notification Domain
// ============================================================

enum NotificationType {
  TRANSACTION
  SECURITY
  ACCOUNT
  TRANSFER
  CARD
  CRYPTO
  LOAN
  SYSTEM
  MARKETING
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
  PUSH
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}

// ============================================================
// ENUMS - Administration Domain
// ============================================================

enum AdminStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

// ============================================================
// ENUMS - Audit Domain
// ============================================================

enum AuditSeverity {
  INFO
  WARNING
  CRITICAL
}

// ============================================================
// ENUMS - Settings Domain
// ============================================================

enum Language {
  EN
  ES
}

enum Theme {
  LIGHT
  DARK
  SYSTEM
}

// ============================================================
// MODELS - Authentication Domain
// ============================================================

model User {
  id                 String     @id @default(uuid()) @db.Uuid
  email              String     @unique @db.VarChar(255)
  emailVerified      Boolean    @default(false) @map("email_verified")
  passwordHash       String     @map("password_hash")
  firstName          String     @map("first_name") @db.VarChar(100)
  lastName           String     @map("last_name") @db.VarChar(100)
  phoneNumber        String?    @map("phone_number") @db.VarChar(20)
  phoneVerified      Boolean    @default(false) @map("phone_verified")
  status             UserStatus @default(PENDING_VERIFICATION)
  kycStatus          KycStatus  @default(NONE) @map("kyc_status")
  kycLevel           KycLevel   @default(LEVEL_0) @map("kyc_level")
  mfaEnabled         Boolean    @default(false) @map("mfa_enabled")
  mfaMethod          String?    @map("mfa_method") @db.VarChar(20)
  lastLoginAt        DateTime?  @map("last_login_at") @db.Timestamptz()
  lastLoginIp        String?    @map("last_login_ip") @db.VarChar(45)
  failedLoginCount   Int        @default(0) @map("failed_login_count")
  lockedUntil        DateTime?  @map("locked_until") @db.Timestamptz()
  passwordChangedAt  DateTime?  @map("password_changed_at") @db.Timestamptz()
  termsAcceptedAt    DateTime?  @map("terms_accepted_at") @db.Timestamptz()
  privacyAcceptedAt  DateTime?  @map("privacy_accepted_at") @db.Timestamptz()
  metadata           Json?      @db.JsonB
  isDemo             Boolean    @default(false) @map("is_demo")
  createdAt          DateTime   @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt          DateTime   @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt          DateTime?  @map("deleted_at") @db.Timestamptz()

  kycDocuments         KycDocument[]
  userSessions         UserSession[]
  mfaSettings          MfaSetting[]
  loginHistory         LoginHistory[]
  securityEventLogs    SecurityEvent[]
  accountHolders       AccountHolder[]
  cardHolders          CardHolder[]
  cryptoTrades         CryptoTrade[]
  investmentAccounts   InvestmentAccount[]
  loanApplications     LoanApplication[] @relation("UserLoanApplications")
  loans                Loan[]
  notifications        Notification[]
  notificationPreference NotificationPreference?
  adminUser            AdminUser?
  auditLogs            AuditLog[] @relation("UserAuditLogs")

  @@index([email])
  @@index([status])
  @@index([phoneNumber])
  @@index([deletedAt])
  @@map("users")
}

model KycDocument {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @map("user_id") @db.Uuid
  documentType    IdDocumentType @map("document_type")
  documentNumber  String         @map("document_number") @db.VarChar(50)
  issuingCountry  String         @map("issuing_country") @db.VarChar(2)
  expirationDate  DateTime       @map("expiration_date") @db.Date()
  fileUrl         String         @map("file_url") @db.VarChar(500)
  status          KycStatus      @default(SUBMITTED)
  rejectionReason String?        @map("rejection_reason") @db.VarChar(500)
  reviewedBy      String?        @map("reviewed_by") @db.Uuid
  reviewedAt      DateTime?      @map("reviewed_at") @db.Timestamptz()
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime       @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt       DateTime?      @map("deleted_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@map("kyc_documents")
}

model UserSession {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  accessToken  String   @map("access_token")
  refreshToken String   @map("refresh_token")
  ipAddress    String   @map("ip_address") @db.VarChar(45)
  userAgent    String   @map("user_agent")
  deviceId     String?  @map("device_id") @db.VarChar(255)
  isActive     Boolean  @default(true) @map("is_active")
  expiresAt    DateTime @map("expires_at") @db.Timestamptz()
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt    DateTime? @map("deleted_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([accessToken])
  @@index([refreshToken])
  @@index([expiresAt])
  @@map("user_sessions")
}

model MfaSetting {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  method    String    @db.VarChar(20)
  secret    String
  isEnabled Boolean   @default(false) @map("is_enabled")
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, method])
  @@index([userId])
  @@map("mfa_settings")
}

model LoginHistory {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  loginMethod   String   @map("login_method") @db.VarChar(50)
  ipAddress     String   @map("ip_address") @db.VarChar(45)
  userAgent     String   @map("user_agent")
  deviceInfo    Json?    @map("device_info") @db.JsonB
  location      Json?    @db.JsonB
  isSuccessful  Boolean  @map("is_successful")
  failureReason String?  @map("failure_reason") @db.VarChar(255)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("login_history")
}

// ============================================================
// MODELS - Account Domain
// ============================================================

model BankAccount {
  id               String         @id @default(uuid()) @db.Uuid
  accountNumber    String         @unique @map("account_number") @db.VarChar(20)
  routingNumber    String         @map("routing_number") @db.VarChar(9)
  type             AccountType
  name             String         @db.VarChar(100)
  nickname         String?        @db.VarChar(100)
  status           AccountStatus  @default(PENDING)
  currency         String         @default("USD") @db.VarChar(3)
  currentBalance   Decimal        @default(0) @map("current_balance") @db.Decimal(19, 4)
  availableBalance Decimal        @default(0) @map("available_balance") @db.Decimal(19, 4)
  pendingBalance   Decimal        @default(0) @map("pending_balance") @db.Decimal(19, 4)
  holdAmount       Decimal        @default(0) @map("hold_amount") @db.Decimal(19, 4)
  overdraftLimit   Decimal        @default(0) @map("overdraft_limit") @db.Decimal(19, 4)
  dailyLimit       Decimal        @default(5000) @map("daily_limit") @db.Decimal(19, 4)
  monthlyLimit     Decimal        @default(25000) @map("monthly_limit") @db.Decimal(19, 4)
  interestRate     Decimal?       @map("interest_rate") @db.Decimal(5, 4)
  freezeReason     FreezeReason?  @map("freeze_reason")
  freezeNote       String?        @map("freeze_note") @db.VarChar(500)
  closedAt         DateTime?      @map("closed_at") @db.Timestamptz()
  closureReason    ClosureReason? @map("closure_reason")
  isDemo           Boolean        @default(false) @map("is_demo")
  metadata         Json?          @db.JsonB
  createdAt        DateTime       @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime       @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt        DateTime?      @map("deleted_at") @db.Timestamptz()
  createdBy        String?        @map("created_by") @db.Uuid
  updatedBy        String?        @map("updated_by") @db.Uuid

  accountHolders    AccountHolder[]
  transactions      Transaction[]
  cardAccounts      Card[]
  loanDisbursements Loan[]         @relation("LoanDisbursementAccount")
  loanPayments      Loan[]         @relation("LoanPaymentAccount")
  achTransfersFrom  AchTransfer[]  @relation("AchFromAccount")
  achTransfersTo    AchTransfer[]  @relation("AchToAccount")
  wireTransfers     WireTransfer[]

  @@index([accountNumber])
  @@index([status])
  @@index([routingNumber])
  @@index([deletedAt])
  @@map("bank_accounts")
}

model AccountHolder {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  accountId   String   @map("account_id") @db.Uuid
  role        String   @default("OWNER") @db.VarChar(20)
  permissions Json?    @db.JsonB
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  user    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  account BankAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([userId, accountId])
  @@index([accountId])
  @@map("account_holders")
}

// ============================================================
// MODELS - Transaction Domain
// ============================================================

model Transaction {
  id                  String            @id @default(uuid()) @db.Uuid
  accountId           String            @map("account_id") @db.Uuid
  type                TransactionType
  status              TransactionStatus @default(PENDING)
  amount              Decimal           @db.Decimal(19, 4)
  currency            String            @default("USD") @db.VarChar(3)
  description         String?           @db.VarChar(255)
  reference           String?           @unique @db.VarChar(50)
  category            String?           @db.VarChar(50)
  counterparty        String?           @db.VarChar(255)
  counterpartyAccount String?           @map("counterparty_account") @db.VarChar(20)
  metadata            Json?             @db.JsonB
  isDemo              Boolean           @default(false) @map("is_demo")
  settledAt           DateTime?         @map("settled_at") @db.Timestamptz()
  createdAt           DateTime          @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt           DateTime          @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt           DateTime?         @map("deleted_at") @db.Timestamptz()
  createdBy           String?           @map("created_by") @db.Uuid
  updatedBy           String?           @map("updated_by") @db.Uuid

  account          BankAccount      @relation(fields: [accountId], references: [id], onDelete: Cascade)
  transactionLines TransactionLine[]
  balanceSnapshots BalanceSnapshot[]
  cardTransactions CardTransaction[]
  loanPayments     LoanPayment[]

  @@index([accountId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@index([reference])
  @@index([deletedAt])
  @@index([accountId, createdAt])
  @@index([accountId, status, createdAt])
  @@map("transactions")
}

model TransactionLine {
  id            String   @id @default(uuid()) @db.Uuid
  transactionId String   @map("transaction_id") @db.Uuid
  entryType     String   @map("entry_type") @db.VarChar(10)
  accountCode   String   @map("account_code") @db.VarChar(20)
  accountName   String   @map("account_name") @db.VarChar(100)
  amount        Decimal  @db.Decimal(19, 4)
  currency      String   @default("USD") @db.VarChar(3)
  description   String?  @db.VarChar(255)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@index([transactionId])
  @@index([accountCode])
  @@map("transaction_lines")
}

model BalanceSnapshot {
  id              String   @id @default(uuid()) @db.Uuid
  accountId       String   @map("account_id") @db.Uuid
  transactionId   String   @map("transaction_id") @db.Uuid
  previousBalance Decimal  @map("previous_balance") @db.Decimal(19, 4)
  newBalance      Decimal  @map("new_balance") @db.Decimal(19, 4)
  changeAmount    Decimal  @map("change_amount") @db.Decimal(19, 4)
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz()

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([transactionId])
  @@index([createdAt])
  @@map("balance_snapshots")
}

// ============================================================
// MODELS - Transfer Domain
// ============================================================

model AchTransfer {
  id              String         @id @default(uuid()) @db.Uuid
  fromAccountId   String         @map("from_account_id") @db.Uuid
  toAccountId     String?        @map("to_account_id") @db.Uuid
  externalRouting String?        @map("external_routing") @db.VarChar(9)
  externalAccount String?        @map("external_account") @db.VarChar(20)
  externalName    String?        @map("external_name") @db.VarChar(255)
  amount          Decimal        @db.Decimal(19, 4)
  currency        String         @default("USD") @db.VarChar(3)
  achClass        AchClass       @default(WEB) @map("ach_class")
  status          TransferStatus @default(PENDING)
  description     String?        @db.VarChar(255)
  failureReason   String?        @map("failure_reason") @db.VarChar(500)
  failureCode     String?        @map("failure_code") @db.VarChar(50)
  reference       String?        @unique @db.VarChar(50)
  metadata        Json?          @db.JsonB
  isDemo          Boolean        @default(false) @map("is_demo")
  completedAt     DateTime?      @map("completed_at") @db.Timestamptz()
  returnedAt      DateTime?      @map("returned_at") @db.Timestamptz()
  returnCode      String?        @map("return_code") @db.VarChar(10)
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime       @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt       DateTime?      @map("deleted_at") @db.Timestamptz()

  fromAccount BankAccount  @relation("AchFromAccount", fields: [fromAccountId], references: [id])
  toAccount   BankAccount? @relation("AchToAccount", fields: [toAccountId], references: [id])

  @@index([fromAccountId])
  @@index([toAccountId])
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("ach_transfers")
}

model WireTransfer {
  id                 String         @id @default(uuid()) @db.Uuid
  accountId          String         @map("account_id") @db.Uuid
  type               String         @db.VarChar(20)
  amount             Decimal        @db.Decimal(19, 4)
  currency           String         @default("USD") @db.VarChar(3)
  beneficiaryName    String         @map("beneficiary_name") @db.VarChar(255)
  beneficiaryBank    String         @map("beneficiary_bank") @db.VarChar(255)
  beneficiaryAccount String         @map("beneficiary_account") @db.VarChar(50)
  routingNumber      String?        @map("routing_number") @db.VarChar(9)
  swiftCode          String?        @map("swift_code") @db.VarChar(11)
  intermediarySwift  String?        @map("intermediary_swift") @db.VarChar(11)
  reference          String?        @unique @db.VarChar(50)
  status             TransferStatus @default(PENDING)
  feeAmount          Decimal        @default(0) @map("fee_amount") @db.Decimal(19, 4)
  description        String?        @db.VarChar(255)
  failureReason      String?        @map("failure_reason") @db.VarChar(500)
  metadata           Json?          @db.JsonB
  isDemo             Boolean        @default(false) @map("is_demo")
  completedAt        DateTime?      @map("completed_at") @db.Timestamptz()
  createdAt          DateTime       @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt          DateTime       @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt          DateTime?      @map("deleted_at") @db.Timestamptz()

  account BankAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("wire_transfers")
}

model Beneficiary {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  nickname        String   @db.VarChar(100)
  bankName        String   @map("bank_name") @db.VarChar(255)
  accountNumber   String   @map("account_number") @db.VarChar(50)
  routingNumber   String?  @map("routing_number") @db.VarChar(9)
  swiftCode       String?  @map("swift_code") @db.VarChar(11)
  accountType     String   @map("account_type") @db.VarChar(20)
  beneficiaryName String   @map("beneficiary_name") @db.VarChar(255)
  country         String   @default("US") @db.VarChar(2)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt       DateTime? @map("deleted_at") @db.Timestamptz()

  @@index([userId])
  @@map("beneficiaries")
}

// ============================================================
// MODELS - Card Domain
// ============================================================

model CardHolder {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  cardId    String   @map("card_id") @db.Uuid
  role      String   @default("PRIMARY") @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([userId, cardId])
  @@index([cardId])
  @@map("card_holders")
}

model Card {
  id                   String             @id @default(uuid()) @db.Uuid
  accountId            String             @map("account_id") @db.Uuid
  cardNumber           String             @unique @map("card_number") @db.VarChar(19)
  lastFour             String             @map("last_four") @db.VarChar(4)
  expiryMonth          Int                @map("expiry_month")
  expiryYear           Int                @map("expiry_year")
  cvvHash              String             @map("cvv_hash")
  cardholderName       String             @map("cardholder_name") @db.VarChar(100)
  type                 CardType
  network              CardNetwork
  status               CardStatus         @default(INACTIVE)
  spendingCategory     CardSpendingCategory @default(GENERAL) @map("spending_category")
  dailyLimit           Decimal            @default(5000) @map("daily_limit") @db.Decimal(19, 4)
  monthlyLimit         Decimal            @default(25000) @map("monthly_limit") @db.Decimal(19, 4)
  singleTxLimit        Decimal            @default(2500) @map("single_tx_limit") @db.Decimal(19, 4)
  dailySpent           Decimal            @default(0) @map("daily_spent") @db.Decimal(19, 4)
  monthlySpent         Decimal            @default(0) @map("monthly_spent") @db.Decimal(19, 4)
  pinHash              String?            @map("pin_hash")
  pinSetAt             DateTime?          @map("pin_set_at") @db.Timestamptz()
  contactlessEnabled   Boolean            @default(true) @map("contactless_enabled")
  onlineEnabled        Boolean            @default(true) @map("online_enabled")
  internationalEnabled Boolean            @default(false) @map("international_enabled")
  atmEnabled           Boolean            @default(true) @map("atm_enabled")
  frozenAt             DateTime?          @map("frozen_at") @db.Timestamptz()
  freezeReason         String?            @map("freeze_reason") @db.VarChar(255)
  activatedAt          DateTime?          @map("activated_at") @db.Timestamptz()
  closedAt             DateTime?          @map("closed_at") @db.Timestamptz()
  isDemo               Boolean            @default(false) @map("is_demo")
  metadata             Json?              @db.JsonB
  createdAt            DateTime           @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt            DateTime           @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt            DateTime?          @map("deleted_at") @db.Timestamptz()
  createdBy            String?            @map("created_by") @db.Uuid
  updatedBy            String?            @map("updated_by") @db.Uuid

  account          BankAccount      @relation(fields: [accountId], references: [id])
  cardHolders      CardHolder[]
  cardTransactions CardTransaction[]
  cardLimits       CardLimit[]
  virtualCards     VirtualCard[]
  disputes         CardDispute[]

  @@index([accountId])
  @@index([cardNumber])
  @@index([status])
  @@index([deletedAt])
  @@map("cards")
}

model CardTransaction {
  id                    String                @id @default(uuid()) @db.Uuid
  cardId                String                @map("card_id") @db.Uuid
  transactionId         String?               @map("transaction_id") @db.Uuid
  type                  CardTransactionType
  status                CardTransactionStatus @default(PENDING)
  amount                Decimal               @db.Decimal(19, 4)
  currency              String                @default("USD") @db.VarChar(3)
  merchantName          String?               @map("merchant_name") @db.VarChar(255)
  merchantCategoryCode  String?               @map("merchant_category_code") @db.VarChar(4)
  merchantCity          String?               @map("merchant_city") @db.VarChar(100)
  merchantCountry       String?               @map("merchant_country") @db.VarChar(2)
  isOnline              Boolean               @default(false) @map("is_online")
  isInternational       Boolean               @default(false) @map("is_international")
  isContactless         Boolean               @default(false) @map("is_contactless")
  declineReason         DeclineReason?        @map("decline_reason")
  authorizationCode     String?               @map("authorization_code") @db.VarChar(10)
  metadata              Json?                 @db.JsonB
  isDemo                Boolean               @default(false) @map("is_demo")
  createdAt             DateTime              @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt             DateTime              @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt             DateTime?             @map("deleted_at") @db.Timestamptz()

  card        Card         @relation(fields: [cardId], references: [id], onDelete: Cascade)
  transaction Transaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  @@index([cardId])
  @@index([transactionId])
  @@index([status])
  @@index([createdAt])
  @@index([merchantName])
  @@index([deletedAt])
  @@index([cardId, createdAt])
  @@index([cardId, status])
  @@map("card_transactions")
}

model CardLimit {
  id          String   @id @default(uuid()) @db.Uuid
  cardId      String   @map("card_id") @db.Uuid
  category    String   @db.VarChar(50)
  limitAmount Decimal  @map("limit_amount") @db.Decimal(19, 4)
  period      String   @db.VarChar(20)
  isEnabled   Boolean  @default(true) @map("is_enabled")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([cardId, category])
  @@index([cardId])
  @@map("card_limits")
}

model VirtualCard {
  id                  String    @id @default(uuid()) @db.Uuid
  cardId              String    @map("card_id") @db.Uuid
  virtualNumber       String    @unique @map("virtual_number") @db.VarChar(19)
  expiryMonth         Int       @map("expiry_month")
  expiryYear          Int       @map("expiry_year")
  isActive            Boolean   @default(true) @map("is_active")
  usageLimit          Int?      @map("usage_limit")
  usageCount          Int       @default(0) @map("usage_count")
  merchantRestriction String?   @map("merchant_restriction") @db.VarChar(255)
  expiresAt           DateTime? @map("expires_at") @db.Timestamptz()
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt           DateTime  @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz()

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
  @@index([virtualNumber])
  @@map("virtual_cards")
}

model CardDispute {
  id                String        @id @default(uuid()) @db.Uuid
  cardId            String        @map("card_id") @db.Uuid
  transactionId     String?       @map("transaction_id") @db.Uuid
  status            DisputeStatus @default(OPEN)
  reason            String        @db.VarChar(255)
  description       String        @db.Text()
  amount            Decimal       @db.Decimal(19, 4)
  provisionalCredit Decimal?      @map("provisional_credit") @db.Decimal(19, 4)
  resolution        String?       @db.VarChar(500)
  resolvedAt        DateTime?     @map("resolved_at") @db.Timestamptz()
  createdAt         DateTime      @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt         DateTime      @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt         DateTime?     @map("deleted_at") @db.Timestamptz()

  card        Card         @relation(fields: [cardId], references: [id])
  transaction Transaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  @@index([cardId])
  @@index([status])
  @@map("card_disputes")
}

// ============================================================
// MODELS - Crypto Domain
// ============================================================

model CryptoWallet {
  id        String             @id @default(uuid()) @db.Uuid
  userId    String             @map("user_id") @db.Uuid
  currency  String             @db.VarChar(10)
  network   BlockchainNetwork
  address   String             @unique @db.VarChar(100)
  label     String?            @db.VarChar(100)
  balance   Decimal            @default(0) @db.Decimal(19, 8)
  status    CryptoWalletStatus @default(ACTIVE)
  isDefault Boolean            @default(false) @map("is_default")
  isDemo    Boolean            @default(false) @map("is_demo")
  createdAt DateTime           @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime           @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt DateTime?          @map("deleted_at") @db.Timestamptz()

  deposits    CryptoDeposit[]
  withdrawals CryptoWithdrawal[]
  trades      CryptoTrade[]

  @@index([userId])
  @@index([currency, network])
  @@index([address])
  @@index([deletedAt])
  @@map("crypto_wallets")
}

model CryptoDeposit {
  id                    String              @id @default(uuid()) @db.Uuid
  walletId              String              @map("wallet_id") @db.Uuid
  txHash                String              @unique @map("tx_hash") @db.VarChar(128)
  fromAddress           String              @map("from_address") @db.VarChar(100)
  amount                Decimal             @db.Decimal(19, 8)
  currency              String              @db.VarChar(10)
  network               BlockchainNetwork
  confirmations         Int                 @default(0)
  requiredConfirmations Int                 @map("required_confirmations")
  status                CryptoDepositStatus @default(PENDING)
  detectedAt            DateTime            @map("detected_at") @db.Timestamptz()
  confirmedAt           DateTime?           @map("confirmed_at") @db.Timestamptz()
  completedAt           DateTime?           @map("completed_at") @db.Timestamptz()
  failureReason         String?             @map("failure_reason") @db.VarChar(500)
  fee                   Decimal?            @db.Decimal(19, 8)
  isDemo                Boolean             @default(false) @map("is_demo")
  createdAt             DateTime            @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt             DateTime            @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt             DateTime?           @map("deleted_at") @db.Timestamptz()

  wallet CryptoWallet @relation(fields: [walletId], references: [id])

  @@index([walletId])
  @@index([txHash])
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("crypto_deposits")
}

model CryptoWithdrawal {
  id           String                @id @default(uuid()) @db.Uuid
  walletId     String                @map("wallet_id") @db.Uuid
  toAddress    String                @map("to_address") @db.VarChar(100)
  amount       Decimal               @db.Decimal(19, 8)
  fee          Decimal               @db.Decimal(19, 8)
  netAmount    Decimal               @map("net_amount") @db.Decimal(19, 8)
  currency     String                @db.VarChar(10)
  network      BlockchainNetwork
  status       CryptoWithdrawalStatus @default(PENDING)
  txHash       String?               @unique @map("tx_hash") @db.VarChar(128)
  failureReason String?              @map("failure_reason") @db.VarChar(500)
  processedAt  DateTime?             @map("processed_at") @db.Timestamptz()
  isDemo       Boolean               @default(false) @map("is_demo")
  createdAt    DateTime              @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime              @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt    DateTime?             @map("deleted_at") @db.Timestamptz()

  wallet CryptoWallet @relation(fields: [walletId], references: [id])

  @@index([walletId])
  @@index([status])
  @@index([txHash])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("crypto_withdrawals")
}

model CryptoTrade {
  id            String            @id @default(uuid()) @db.Uuid
  userId        String            @map("user_id") @db.Uuid
  walletId      String            @map("wallet_id") @db.Uuid
  side          String            @db.VarChar(4)
  fromCurrency  String            @map("from_currency") @db.VarChar(10)
  toCurrency    String            @map("to_currency") @db.VarChar(10)
  fromAmount    Decimal           @map("from_amount") @db.Decimal(19, 8)
  toAmount      Decimal           @map("to_amount") @db.Decimal(19, 8)
  price         Decimal           @db.Decimal(19, 8)
  fee           Decimal           @db.Decimal(19, 8)
  feeCurrency   String            @map("fee_currency") @db.VarChar(10)
  status        CryptoTradeStatus @default(PENDING)
  executedAt    DateTime?         @map("executed_at") @db.Timestamptz()
  failureReason String?           @map("failure_reason") @db.VarChar(500)
  metadata      Json?             @db.JsonB
  isDemo        Boolean           @default(false) @map("is_demo")
  createdAt     DateTime          @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime          @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt     DateTime?         @map("deleted_at") @db.Timestamptz()

  user   User         @relation(fields: [userId], references: [id])
  wallet CryptoWallet @relation(fields: [walletId], references: [id])

  @@index([userId])
  @@index([walletId])
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("crypto_trades")
}

// ============================================================
// MODELS - Investment Domain
// ============================================================

model InvestmentAccount {
  id                  String                 @id @default(uuid()) @db.Uuid
  userId              String                 @map("user_id") @db.Uuid
  accountNumber       String                 @unique @map("account_number") @db.VarChar(20)
  type                String                 @default("INDIVIDUAL") @db.VarChar(20)
  status              InvestmentAccountStatus @default(PENDING)
  totalValue          Decimal                @default(0) @map("total_value") @db.Decimal(19, 4)
  cashBalance         Decimal                @default(0) @map("cash_balance") @db.Decimal(19, 4)
  totalReturn         Decimal                @default(0) @map("total_return") @db.Decimal(19, 4)
  totalReturnPercent  Decimal?               @map("total_return_percent") @db.Decimal(8, 4)
  isDemo              Boolean                @default(false) @map("is_demo")
  createdAt           DateTime               @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt           DateTime               @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt           DateTime?              @map("deleted_at") @db.Timestamptz()

  user     User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  holdings InvestmentHolding[]
  orders   InvestmentOrder[]

  @@index([userId])
  @@index([accountNumber])
  @@index([status])
  @@index([deletedAt])
  @@map("investment_accounts")
}

model InvestmentAsset {
  id            String              @id @default(uuid()) @db.Uuid
  symbol        String              @unique @db.VarChar(10)
  name          String              @db.VarChar(255)
  type          InvestmentAssetType
  exchange      String              @db.VarChar(50)
  currency      String              @default("USD") @db.VarChar(3)
  currentPrice  Decimal?            @map("current_price") @db.Decimal(19, 4)
  isActive      Boolean             @default(true) @map("is_active")
  isFractional  Boolean             @default(true) @map("is_fractional")
  minInvestment Decimal?            @map("min_investment") @db.Decimal(19, 4)
  iconUrl       String?             @map("icon_url") @db.VarChar(500)
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime            @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt     DateTime?           @map("deleted_at") @db.Timestamptz()

  holdings InvestmentHolding[]
  orders   InvestmentOrder[]

  @@index([symbol])
  @@index([type])
  @@index([deletedAt])
  @@map("investment_assets")
}

model InvestmentHolding {
  id                   String    @id @default(uuid()) @db.Uuid
  investmentAccountId  String    @map("investment_account_id") @db.Uuid
  assetId              String    @map("asset_id") @db.Uuid
  quantity             Decimal   @db.Decimal(19, 8)
  averageCost          Decimal   @map("average_cost") @db.Decimal(19, 4)
  totalCost            Decimal   @map("total_cost") @db.Decimal(19, 4)
  currentValue         Decimal   @map("current_value") @db.Decimal(19, 4)
  unrealizedPnl        Decimal   @map("unrealized_pnl") @db.Decimal(19, 4)
  unrealizedPnlPercent Decimal   @map("unrealized_pnl_percent") @db.Decimal(8, 4)
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  investmentAccount InvestmentAccount @relation(fields: [investmentAccountId], references: [id], onDelete: Cascade)
  asset             InvestmentAsset   @relation(fields: [assetId], references: [id])

  @@unique([investmentAccountId, assetId])
  @@index([investmentAccountId])
  @@index([assetId])
  @@map("investment_holdings")
}

model InvestmentOrder {
  id                  String               @id @default(uuid()) @db.Uuid
  investmentAccountId String               @map("investment_account_id") @db.Uuid
  assetId             String               @map("asset_id") @db.Uuid
  side                InvestmentOrderSide
  type                InvestmentOrderType
  status              InvestmentOrderStatus @default(PENDING)
  quantity            Decimal              @db.Decimal(19, 8)
  price               Decimal?             @db.Decimal(19, 4)
  stopPrice           Decimal?             @map("stop_price") @db.Decimal(19, 4)
  filledQuantity      Decimal              @default(0) @map("filled_quantity") @db.Decimal(19, 8)
  filledPrice         Decimal?             @map("filled_price") @db.Decimal(19, 4)
  totalAmount         Decimal              @map("total_amount") @db.Decimal(19, 4)
  fee                 Decimal              @default(0) @db.Decimal(19, 4)
  placedAt            DateTime             @default(now()) @map("placed_at") @db.Timestamptz()
  filledAt            DateTime?            @map("filled_at") @db.Timestamptz()
  cancelledAt         DateTime?            @map("cancelled_at") @db.Timestamptz()
  expiresAt           DateTime?            @map("expires_at") @db.Timestamptz()
  failureReason       String?              @map("failure_reason") @db.VarChar(500)
  isDemo              Boolean              @default(false) @map("is_demo")
  createdAt           DateTime             @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt           DateTime             @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt           DateTime?            @map("deleted_at") @db.Timestamptz()

  investmentAccount InvestmentAccount @relation(fields: [investmentAccountId], references: [id], onDelete: Cascade)
  asset             InvestmentAsset   @relation(fields: [assetId], references: [id])

  @@index([investmentAccountId])
  @@index([assetId])
  @@index([status])
  @@index([placedAt])
  @@index([deletedAt])
  @@map("investment_orders")
}

// ============================================================
// MODELS - Loan Domain
// ============================================================

model LoanApplication {
  id                   String                @id @default(uuid()) @db.Uuid
  userId               String                @map("user_id") @db.Uuid
  type                 LoanType
  requestedAmount      Decimal               @map("requested_amount") @db.Decimal(19, 4)
  requestedTermMonths  Int                   @map("requested_term_months")
  purpose              String                @db.VarChar(255)
  annualIncome         Decimal               @map("annual_income") @db.Decimal(19, 4)
  employmentStatus     EmploymentStatus      @map("employment_status")
  employerName         String?               @map("employer_name") @db.VarChar(255)
  creditScore          Int?                  @map("credit_score")
  status               LoanApplicationStatus @default(SUBMITTED)
  approvedAmount       Decimal?              @map("approved_amount") @db.Decimal(19, 4)
  approvedRate         Decimal?              @map("approved_rate") @db.Decimal(5, 4)
  approvedTerm         Int?                  @map("approved_term")
  denialReason         String?               @map("denial_reason") @db.VarChar(500)
  reviewedBy           String?               @map("reviewed_by") @db.Uuid
  reviewedAt           DateTime?             @map("reviewed_at") @db.Timestamptz()
  expiresAt            DateTime?             @map("expires_at") @db.Timestamptz()
  createdAt            DateTime              @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt            DateTime              @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt            DateTime?             @map("deleted_at") @db.Timestamptz()

  user      User @relation("UserLoanApplications", fields: [userId], references: [id])
  loan      Loan?
  documents LoanDocument[]

  @@index([userId])
  @@index([status])
  @@index([deletedAt])
  @@map("loan_applications")
}

model Loan {
  id                 String     @id @default(uuid()) @db.Uuid
  userId             String     @map("user_id") @db.Uuid
  accountId          String     @map("account_id") @db.Uuid
  applicationId      String     @unique @map("application_id") @db.Uuid
  loanNumber         String     @unique @map("loan_number") @db.VarChar(20)
  type               LoanType
  status             LoanStatus @default(ACTIVE)
  principalAmount    Decimal    @map("principal_amount") @db.Decimal(19, 4)
  outstandingBalance Decimal    @map("outstanding_balance") @db.Decimal(19, 4)
  interestRate       Decimal    @map("interest_rate") @db.Decimal(5, 4)
  termMonths         Int        @map("term_months")
  monthlyPayment     Decimal    @map("monthly_payment") @db.Decimal(19, 4)
  totalInterest      Decimal    @map("total_interest") @db.Decimal(19, 4)
  totalPayable       Decimal    @map("total_payable") @db.Decimal(19, 4)
  nextPaymentDate    DateTime   @map("next_payment_date") @db.Date()
  nextPaymentAmount  Decimal    @map("next_payment_amount") @db.Decimal(19, 4)
  paymentsMade       Int        @default(0) @map("payments_made")
  paymentsRemaining  Int        @map("payments_remaining")
  latePaymentCount   Int        @default(0) @map("late_payment_count")
  disbursedAt        DateTime   @map("disbursed_at") @db.Timestamptz()
  maturityDate       DateTime   @map("maturity_date") @db.Date()
  paidOffAt          DateTime?  @map("paid_off_at") @db.Timestamptz()
  defaultDate        DateTime?  @map("default_date") @db.Date()
  autopayEnabled     Boolean    @default(true) @map("autopay_enabled")
  createdAt          DateTime   @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt          DateTime   @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt          DateTime?  @map("deleted_at") @db.Timestamptz()

  user           User            @relation(fields: [userId], references: [id])
  account        BankAccount     @relation("LoanDisbursementAccount", fields: [accountId], references: [id])
  paymentAccount BankAccount     @relation("LoanPaymentAccount", fields: [accountId], references: [id])
  application    LoanApplication @relation(fields: [applicationId], references: [id])
  payments       LoanPayment[]
  schedule       LoanSchedule[]

  @@index([userId])
  @@index([status])
  @@index([nextPaymentDate])
  @@index([loanNumber])
  @@index([deletedAt])
  @@map("loans")
}

model LoanPayment {
  id               String        @id @default(uuid()) @db.Uuid
  loanId           String        @map("loan_id") @db.Uuid
  transactionId    String?       @map("transaction_id") @db.Uuid
  paymentNumber    Int           @map("payment_number")
  principalAmount  Decimal       @map("principal_amount") @db.Decimal(19, 4)
  interestAmount   Decimal       @map("interest_amount") @db.Decimal(19, 4)
  feeAmount        Decimal       @default(0) @map("fee_amount") @db.Decimal(19, 4)
  totalAmount      Decimal       @map("total_amount") @db.Decimal(19, 4)
  remainingBalance Decimal       @map("remaining_balance") @db.Decimal(19, 4)
  status           PaymentStatus
  dueDate          DateTime      @map("due_date") @db.Date()
  paidAt           DateTime?     @map("paid_at") @db.Timestamptz()
  isLate           Boolean       @default(false) @map("is_late")
  lateFeeCharged   Decimal?      @map("late_fee_charged") @db.Decimal(19, 4)
  createdAt        DateTime      @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime      @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt        DateTime?     @map("deleted_at") @db.Timestamptz()

  loan        Loan         @relation(fields: [loanId], references: [id], onDelete: Cascade)
  transaction Transaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  @@index([loanId])
  @@index([dueDate])
  @@index([status])
  @@index([deletedAt])
  @@map("loan_payments")
}

model LoanSchedule {
  id               String   @id @default(uuid()) @db.Uuid
  loanId           String   @map("loan_id") @db.Uuid
  paymentNumber    Int      @map("payment_number")
  dueDate          DateTime @map("due_date") @db.Date()
  principalAmount  Decimal  @map("principal_amount") @db.Decimal(19, 4)
  interestAmount   Decimal  @map("interest_amount") @db.Decimal(19, 4)
  totalAmount      Decimal  @map("total_amount") @db.Decimal(19, 4)
  remainingBalance Decimal  @map("remaining_balance") @db.Decimal(19, 4)
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  loan Loan @relation(fields: [loanId], references: [id], onDelete: Cascade)

  @@unique([loanId, paymentNumber])
  @@index([loanId])
  @@map("loan_schedules")
}

model LoanDocument {
  id              String         @id @default(uuid()) @db.Uuid
  applicationId   String         @map("application_id") @db.Uuid
  type            DocumentType
  fileName        String         @map("file_name") @db.VarChar(255)
  fileUrl         String         @map("file_url") @db.VarChar(500)
  fileSize        Int            @map("file_size")
  mimeType        String         @map("mime_type") @db.VarChar(100)
  status          DocumentStatus @default(UPLOADED)
  rejectionReason String?        @map("rejection_reason") @db.VarChar(255)
  reviewedBy      String?        @map("reviewed_by") @db.Uuid
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime       @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt       DateTime?      @map("deleted_at") @db.Timestamptz()

  application LoanApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
  @@index([deletedAt])
  @@map("loan_documents")
}

// ============================================================
// MODELS - Notification Domain
// ============================================================

model Notification {
  id         String               @id @default(uuid()) @db.Uuid
  userId     String               @map("user_id") @db.Uuid
  type       NotificationType
  title      String               @db.VarChar(255)
  body       String               @db.Text()
  data       Json?                @db.JsonB
  priority   NotificationPriority @default(NORMAL)
  isRead     Boolean              @default(false) @map("is_read")
  readAt     DateTime?            @map("read_at") @db.Timestamptz()
  archivedAt DateTime?            @map("archived_at") @db.Timestamptz()
  createdAt  DateTime             @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt  DateTime             @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt  DateTime?            @map("deleted_at") @db.Timestamptz()

  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  deliveries NotificationDelivery[]

  @@index([userId])
  @@index([userId, isRead])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("notifications")
}

model NotificationPreference {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @unique @map("user_id") @db.Uuid
  emailEnabled     Boolean  @default(true) @map("email_enabled")
  smsEnabled       Boolean  @default(false) @map("sms_enabled")
  pushEnabled      Boolean  @default(true) @map("push_enabled")
  transactionAlerts Boolean @default(true) @map("transaction_alerts")
  securityAlerts   Boolean  @default(true) @map("security_alerts")
  marketingEmails  Boolean  @default(false) @map("marketing_emails")
  loginAlerts      Boolean  @default(true) @map("login_alerts")
  balanceAlerts    Boolean  @default(true) @map("balance_alerts")
  transferAlerts   Boolean  @default(true) @map("transfer_alerts")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

model NotificationTemplate {
  id              String              @id @default(uuid()) @db.Uuid
  code            String              @unique @db.VarChar(100)
  name            String              @db.VarChar(255)
  type            NotificationType
  channel         NotificationChannel
  subjectTemplate String              @map("subject_template") @db.VarChar(255)
  bodyTemplate    String              @map("body_template") @db.Text()
  isActive        Boolean             @default(true) @map("is_active")
  createdAt       DateTime            @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime            @updatedAt @map("updated_at") @db.Timestamptz()

  @@index([code])
  @@index([type, channel])
  @@map("notification_templates")
}

model NotificationDelivery {
  id                String           @id @default(uuid()) @db.Uuid
  notificationId    String           @map("notification_id") @db.Uuid
  channel           NotificationChannel
  status            DeliveryStatus   @default(PENDING)
  recipient         String           @db.VarChar(255)
  sentAt            DateTime?        @map("sent_at") @db.Timestamptz()
  deliveredAt       DateTime?        @map("delivered_at") @db.Timestamptz()
  failedAt          DateTime?        @map("failed_at") @db.Timestamptz()
  failureReason     String?          @map("failure_reason") @db.VarChar(255)
  retryCount        Int              @default(0) @map("retry_count")
  provider          String?          @db.VarChar(50)
  providerMessageId String?          @map("provider_message_id") @db.VarChar(255)
  createdAt         DateTime         @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt         DateTime         @updatedAt @map("updated_at") @db.Timestamptz()

  notification Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@index([notificationId])
  @@index([status])
  @@map("notification_deliveries")
}

// ============================================================
// MODELS - Administration Domain
// ============================================================

model AdminUser {
  id          String      @id @default(uuid()) @db.Uuid
  userId      String?     @unique @map("user_id") @db.Uuid
  email       String      @unique @db.VarChar(255)
  firstName   String      @map("first_name") @db.VarChar(100)
  lastName    String      @map("last_name") @db.VarChar(100)
  status      AdminStatus @default(ACTIVE)
  lastLoginAt DateTime?   @map("last_login_at") @db.Timestamptz()
  createdAt   DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime    @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt   DateTime?   @map("deleted_at") @db.Timestamptz()

  user       User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  adminRoles AdminUserRole[]
  actions    AdminAction[]
  auditLogs  AuditLog[]      @relation("AdminAuditLogs")

  @@index([email])
  @@index([status])
  @@index([deletedAt])
  @@map("admin_users")
}

model AdminRole {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique @db.VarChar(50)
  description String?  @db.Text()
  isSystem    Boolean  @default(false) @map("is_system")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  adminUsers  AdminUserRole[]
  permissions AdminRolePermission[]

  @@map("admin_roles")
}

model AdminPermission {
  id          String   @id @default(uuid()) @db.Uuid
  code        String   @unique @db.VarChar(100)
  name        String   @db.VarChar(255)
  description String?  @db.Text()
  resource    String   @db.VarChar(50)
  action      String   @db.VarChar(50)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  roles AdminRolePermission[]

  @@map("admin_permissions")
}

model AdminUserRole {
  id          String   @id @default(uuid()) @db.Uuid
  adminUserId String   @map("admin_user_id") @db.Uuid
  roleId      String   @map("role_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()

  adminUser AdminUser @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  role      AdminRole @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([adminUserId, roleId])
  @@index([roleId])
  @@map("admin_user_roles")
}

model AdminRolePermission {
  id           String   @id @default(uuid()) @db.Uuid
  roleId       String   @map("role_id") @db.Uuid
  permissionId String   @map("permission_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()

  role       AdminRole       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission AdminPermission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([permissionId])
  @@map("admin_role_permissions")
}

model AdminAction {
  id           String   @id @default(uuid()) @db.Uuid
  adminUserId  String   @map("admin_user_id") @db.Uuid
  action       String   @db.VarChar(100)
  resourceType String   @map("resource_type") @db.VarChar(50)
  resourceId   String   @map("resource_id") @db.Uuid
  details      Json?    @db.JsonB
  ipAddress    String   @map("ip_address") @db.VarChar(45)
  userAgent    String   @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  adminUser AdminUser @relation(fields: [adminUserId], references: [id])

  @@index([adminUserId])
  @@index([resourceType, resourceId])
  @@index([createdAt])
  @@map("admin_actions")
}

// ============================================================
// MODELS - Audit Domain
// ============================================================

model AuditLog {
  id          String        @id @default(uuid()) @db.Uuid
  eventId     String        @map("event_id") @db.Uuid
  userId      String?       @map("user_id") @db.Uuid
  adminUserId String?       @map("admin_user_id") @db.Uuid
  resourceType String       @map("resource_type") @db.VarChar(50)
  resourceId  String        @map("resource_id") @db.Uuid
  action      String        @db.VarChar(100)
  description String        @db.Text()
  oldValues   Json?         @map("old_values") @db.JsonB
  newValues   Json?         @map("new_values") @db.JsonB
  ipAddress   String?       @map("ip_address") @db.VarChar(45)
  userAgent   String?       @db.Text()
  sessionId   String?       @map("session_id") @db.Uuid
  metadata    Json?         @db.JsonB
  severity    AuditSeverity @default(INFO)
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz()

  event     AuditEvent @relation(fields: [eventId], references: [id])
  user      User?      @relation("UserAuditLogs", fields: [userId], references: [id], onDelete: SetNull)
  adminUser AdminUser? @relation("AdminAuditLogs", fields: [adminUserId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([eventId])
  @@index([createdAt])
  @@index([severity])
  @@map("audit_logs")
}

model AuditEvent {
  id          String        @id @default(uuid()) @db.Uuid
  code        String        @unique @db.VarChar(100)
  name        String        @db.VarChar(255)
  category    String        @db.VarChar(50)
  description String?       @db.Text()
  severity    AuditSeverity @default(INFO)
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime      @updatedAt @map("updated_at") @db.Timestamptz()

  auditLogs AuditLog[]

  @@map("audit_events")
}

model SecurityEvent {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String?   @map("user_id") @db.Uuid
  eventType   String    @map("event_type") @db.VarChar(50)
  description String    @db.Text()
  ipAddress   String?   @map("ip_address") @db.VarChar(45)
  userAgent   String?   @db.Text()
  deviceInfo  Json?     @map("device_info") @db.JsonB
  location    Json?     @db.JsonB
  riskScore   Int?      @map("risk_score")
  isResolved  Boolean   @default(false) @map("is_resolved")
  resolvedAt  DateTime? @map("resolved_at") @db.Timestamptz()
  resolvedBy  String?   @map("resolved_by") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
  @@index([isResolved])
  @@map("security_events")
}

// ============================================================
// MODELS - Settings Domain
// ============================================================

model UserSetting {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @unique @map("user_id") @db.Uuid
  language   Language @default(EN)
  theme      Theme    @default(SYSTEM)
  timezone   String   @default("America/New_York") @db.VarChar(50)
  currency   String   @default("USD") @db.VarChar(3)
  dateFormat String   @default("MM/DD/YYYY") @map("date_format") @db.VarChar(20)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  @@map("user_settings")
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'apps', 'backend', 'prisma', 'schema.prisma'), schema);
console.log('Schema written successfully. Length:', schema.length, 'characters');