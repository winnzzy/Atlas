# Transfer API

Base path: `/api/transfers`

## Endpoints

- `POST /api/transfers` create a transfer
- `GET /api/transfers` search transfers
- `GET /api/transfers/:id` get a transfer
- `POST /api/transfers/:id/submit` submit a queued transfer
- `POST /api/transfers/:id/cancel` cancel a transfer
- `POST /api/transfers/:id/reverse` reverse a transfer
- `POST /api/transfers/beneficiaries` create beneficiary
- `GET /api/transfers/beneficiaries` list beneficiaries
- `PATCH /api/transfers/beneficiaries/:id/favorite` favorite beneficiary
- `POST /api/transfers/beneficiaries/:id/verify` verify beneficiary
- `DELETE /api/transfers/beneficiaries/:id` delete beneficiary

## Notes

All endpoints require authentication. The controller delegates to the Transfer Service, which delegates payment posting to the Transaction Engine.
