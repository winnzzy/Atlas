# Card Security

## PAN and CVV

- PAN is masked for all standard API responses.
- Full PAN reveal is limited to demo cards through explicit reveal endpoint.
- CVV is stored as hashed placeholder representation.

## Tokens

- Each card has a generated card token for internal references.
- Tokenized values are preferred over raw card numbers for logs and metadata.

## Controls and Risk Hooks

- Spending controls are available per card.
- Velocity/fraud hooks are represented as policy checkpoints.
- Device binding and 3DS are kept as extensibility hooks in metadata/event payloads.

## PCI Boundary

- Card module is an orchestration boundary only.
- Ledger and transaction modules handle accounting; card module does not.
- Sensitive PAN handling should be isolated further when external processor integration begins.
