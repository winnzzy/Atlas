# Notification Event Subscriptions

## Subscribed Domains

- Accounts: account.created, account.frozen, account.closed
- Transactions: transaction.posted, transaction.failed, transaction.reversed
- Transfers: transfer.created, transfer.completed, transfer.failed
- Cards: card.issued, card.activated, card.frozen, card.cancelled
- Investments: investment.deposit.approved, investment.withdrawal.approved, investment.portfolio.updated, investment.asset.price_updated
- Authentication: auth.login, auth.password_reset, auth.session_revoked

## Event Handling Rules

- Each event is mapped into a NotificationContext with type, priority, templateCode, variables, and source metadata.
- Events without a recipient scope are consumed for observability only.
- Missing account-holder lookups cause notification skip, not business failure.

## Notification Types

- SECURITY
- TRANSACTION
- TRANSFER
- CARD
- INVESTMENT
- SYSTEM
- MARKETING
- ADMIN

## Failure Isolation

Notification event handling failures are logged and swallowed at the notification layer.

Business transaction outcomes are never rolled back by notification pipeline errors.
