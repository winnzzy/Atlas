import { Injectable, Logger } from '@nestjs/common';
import { InvestmentDomainException } from '../exceptions/investment-domain.exception';
import {
  AssetStatus,
  DepositStatus,
  WithdrawalStatus,
  WalletStatus,
} from '../enums/investment-status.enum';

@Injectable()
export class InvestmentPolicy {
  private readonly logger = new Logger(InvestmentPolicy.name);

  assertCanDeposit(productStatus: AssetStatus, walletStatus: WalletStatus, amount: number): void {
    if (productStatus !== AssetStatus.ACTIVE) {
      throw InvestmentDomainException.invalidStatusTransition('deposit', productStatus);
    }
    if (walletStatus !== WalletStatus.ACTIVE) {
      throw InvestmentDomainException.invalidStatusTransition('deposit', walletStatus);
    }
    if (amount <= 0) {
      throw InvestmentDomainException.invalidAmount(`Amount must be greater than zero: ${amount}`);
    }
  }

  assertCanApproveDeposit(status: DepositStatus): void {
    if (status !== DepositStatus.PENDING) {
      throw InvestmentDomainException.invalidStatusTransition('approve', status);
    }
  }

  assertCanRejectDeposit(status: DepositStatus): void {
    if (status !== DepositStatus.PENDING) {
      throw InvestmentDomainException.invalidStatusTransition('reject', status);
    }
  }

  assertCanWithdraw(
    productStatus: AssetStatus,
    withdrawalStatus: WithdrawalStatus | null,
    amount: number,
    availableQuantity: number,
    minWithdrawal: number,
    withdrawalFee: number,
  ): void {
    if (productStatus !== AssetStatus.ACTIVE) {
      throw InvestmentDomainException.invalidStatusTransition('withdrawal', productStatus);
    }
    if (withdrawalStatus === WithdrawalStatus.PENDING) {
      throw InvestmentDomainException.pendingWithdrawalExists();
    }
    if (amount <= 0) {
      throw InvestmentDomainException.invalidAmount(`Amount must be greater than zero: ${amount}`);
    }
    if (amount < minWithdrawal) {
      throw InvestmentDomainException.belowMinWithdrawal(amount, minWithdrawal);
    }
    const netAmount = amount - withdrawalFee;
    if (netAmount <= 0) {
      throw InvestmentDomainException.invalidAmount(`Amount must exceed withdrawal fee: ${amount}`);
    }
    if (amount > availableQuantity) {
      throw InvestmentDomainException.insufficientBalance(availableQuantity, amount);
    }
  }

  assertCanApproveWithdrawal(status: WithdrawalStatus): void {
    if (status !== WithdrawalStatus.PENDING) {
      throw InvestmentDomainException.invalidStatusTransition('approve', status);
    }
  }

  assertCanRejectWithdrawal(status: WithdrawalStatus): void {
    if (status !== WithdrawalStatus.PENDING) {
      throw InvestmentDomainException.invalidStatusTransition('reject', status);
    }
  }

  assertCanUpdatePrice(productStatus: AssetStatus): void {
    if (productStatus !== AssetStatus.ACTIVE) {
      throw InvestmentDomainException.invalidStatusTransition('update_price', productStatus);
    }
  }

  assertCanManageWallet(productStatus: AssetStatus): void {
    if (productStatus !== AssetStatus.ACTIVE) {
      throw InvestmentDomainException.invalidStatusTransition('manage_wallet', productStatus);
    }
  }

  assertAssetCanSuspend(status: AssetStatus): void {
    if (status === AssetStatus.SUSPENDED) {
      throw InvestmentDomainException.assetAlreadySuspended();
    }
  }

  assertAssetCanDisable(status: AssetStatus): void {
    if (status === AssetStatus.DISABLED) {
      throw InvestmentDomainException.assetAlreadyDisabled();
    }
  }

  assertAssetCanActivate(status: AssetStatus): void {
    if (status === AssetStatus.ACTIVE) {
      throw InvestmentDomainException.assetAlreadyActive();
    }
  }

  assertAssetCanBeDeleted(hasHoldings: boolean): void {
    if (hasHoldings) {
      throw InvestmentDomainException.assetInUse();
    }
  }

  assertWalletCanBeDeleted(): void {
    this.logger.debug('Wallet deletion allowed - no holdings linked to wallets');
  }
}