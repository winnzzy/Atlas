# Investment Platform Sequence Diagrams

## Deposit Flow

```
Customer                 InvestmentController      DepositService        Validator/Policy
    |                           |                       |                      |
    | POST /deposits            |                       |                      |
    |-------------------------->|                       |                      |
    |                           | validateDeposit()     |                      |
    |                           |---------------------->|                      |
    |                           |                       | checkPolicy()        |
    |                           |                       |--------------------->|
    |                           |                       |<---------------------|
    |                           |                       |                      |
    |                           |                       | verifyAsset()        |
    |                           |                       | verifyWallet()       |
    |                           |                       |                      |
    |                           |                       | createDeposit()      |
    |                           |                       |-----> Repository     |
    |                           |                       |                      |
    |                           |                       | emit(DepositRequested)|
    |                           |                       |                      |
    |<-- 201 Created -----------|                       |                      |
    |                           |                       |                      |

Admin                   InvestmentController      ApprovalService       TransactionService
    |                           |                       |                      |
    | POST /admin/deposits/:id/approve                 |                      |
    |-------------------------->|                       |                      |
    |                           | approveDeposit()      |                      |
    |                           |---------------------->|                      |
    |                           |                       |                      |
    |                           |                       | validateApproval()   |
    |                           |                       | updateStatus()       |
    |                           |                       |                      |
    |                           |                       | createTransaction()  |
    |                           |                       |--------------------->|
    |                           |                       |                      |
    |                           |                       | updatePortfolio()    |
    |                           |                       |                      |
    |                           |                       | emit(DepositApproved)|
    |                           |                       |                      |
    |<-- 200 OK ----------------|                       |                      |
```

## Withdrawal Flow

```
Customer                 InvestmentController    WithdrawalService      Validator/Policy
    |                           |                       |                      |
    | POST /withdrawals         |                       |                      |
    |-------------------------->|                       |                      |
    |                           | validateWithdrawal()  |                      |
    |                           |---------------------->|                      |
    |                           |                       | checkPolicy()        |
    |                           |                       |--------------------->|
    |                           |                       |                      |
    |                           |                       | checkBalance()       |
    |                           |                       | calculateFee()       |
    |                           |                       |                      |
    |                           |                       | createWithdrawal()   |
    |                           |                       |-----> Repository     |
    |                           |                       |                      |
    |                           |                       | emit(WithdrawalRequested)|
    |                           |                       |                      |
    |<-- 201 Created -----------|                       |                      |

Admin                   InvestmentController    ApprovalService       TransactionService
    |                           |                       |                      |
    | POST /admin/withdrawals/:id/approve              |                      |
    |-------------------------->|                       |                      |
    |                           | approveWithdrawal()   |                      |
    |                           |---------------------->|                      |
    |                           |                       |                      |
    |                           |                       | validateApproval()   |
    |                           |                       | updateStatus()       |
    |                           |                       |                      |
    |                           |                       | createTransaction()  |
    |                           |                       |--------------------->|
    |                           |                       |                      |
    |                           |                       | updatePortfolio()    |
    |                           |                       |                      |
    |                           |                       | emit(WithdrawalApproved)|
    |                           |                       |                      |
    |<-- 200 OK ----------------|                       |                      |
```

## Portfolio Calculation Flow

```
PortfolioService        Repository              PricingService
    |                       |                       |
    | getPortfolio()        |                       |
    |---------------------->|                       |
    |                       |                       |
    | getHoldings()         |                       |
    |---------------------->|                       |
    |                       |                       |
    | getCurrentPrices()    |                       |
    |---------------------------------------------->|
    |                       |                       |
    |                       |                       | getPrices()
    |<----------------------------------------------|
    |                       |                       |
    | calculateTotalValue() |                       |
    | calculateAllocation() |                       |
    | calculatePnL()        |                       |
    |                       |                       |
    | return portfolio view |                       |
```

## Price Update Flow

```
Admin                   InvestmentController    PricingService         EventEmitter
    |                           |                       |                      |
    | POST /admin/prices        |                       |                      |
    |-------------------------->|                       |                      |
    |                           | updatePrice()         |                      |
    |                           |---------------------->|                      |
    |                           |                       |                      |
    |                           |                       | validatePrice()      |
    |                           |                       | updateAssetPrice()   |
    |                           |                       |                      |
    |                           |                       | emit(PriceUpdated)   |
    |                           |                       |                      |
    |                           |                       | emit(AssetPriceUpdated)
    |<-- 200 OK ----------------|                       |                      |
```

## Wallet Management Flow

```
Admin                   InvestmentController    WalletService          EventEmitter
    |                           |                       |                      |
    | POST /admin/wallets       |                       |                      |
    |-------------------------->|                       |                      |
    |                           | createWallet()        |                      |
    |                           |---------------------->|                      |
    |                           |                       |                      |
    |                           |                       | validateAddress()    |
    |                           |                       | checkDuplicate()     |
    |                           |                       | saveWallet()         |
    |                           |                       |                      |
    |                           |                       | emit(WalletChanged)  |
    |                           |                       |--------------------->|
    |                           |                       |                      |
    |<-- 201 Created -----------|                       |                      |
```

## Transaction Integration

```
ApprovalService         TransactionService      LedgerService
    |                       |                       |
    | createTransaction()   |                       |
    |---------------------->|                       |
    |                       |                       |
    |                       | createTransaction()   |
    |                       | postJournal()         |
    |                       |--------------------->|
    |                       |                       |
    |                       |                       | debitCustomer()
    |                       |                       | creditPlatform()
    |                       |                       |
    |                       |<----- journalId ------|
    |                       |                       |
    |<----- transactionId --|                       |
```

## Event Flow

```
InvestmentService       EventEmitter            EventListener           AuditService
    |                       |                       |                       |
    | emit(Event)           |                       |                       |
    |---------------------->|                       |                       |
    |                       | onEvent()             |                       |
    |                       |--------------------->|                       |
    |                       |                       |                       |
    |                       |                       | handleEvent()         |
    |                       |                       |--------------------->|
    |                       |                       |                       |
    |                       |                       |                       | logAudit()
    |                       |                       |                       |-----> DB
    |                       |                       |                       |
    |                       |                       |<----- success --------|
    |                       |                       |                       |
    |                       |<----- handled --------|                       |