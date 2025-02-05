// services/rebalanceService.ts
import axios from 'axios';
import { ConsoleKit, Address } from 'brahma-console-kit';
import { YieldData } from './yieldMonitor';
import { BASE_CHAIN_ID, MAX_SLIPPAGE, REBALANCE_THRESHOLD } from '../config/protocols';

export class RebalanceService {
  private ensoApiKey: string;
  private consoleKit: ConsoleKit;

  constructor(ensoApiKey: string, consoleKit: ConsoleKit) {
    this.ensoApiKey = ensoApiKey;
    this.consoleKit = consoleKit;
  }

  async executeRebalance(
    accountAddress: string,
    from: YieldData,
    to: YieldData,
    amount: bigint
  ) {
    if (amount < BigInt(REBALANCE_THRESHOLD)) {
      console.log('Amount too small to rebalance:', amount.toString());
      return null;
    }

    try {
      // Create bundle of actions using Enso Bundle API
      const bundleResponse = await axios.post(
        'https://api.enso.finance/api/v1/shortcuts/bundle',
        [
          // 1. Withdraw from current protocol
          {
            protocol: from.protocol.toLowerCase(),
            action: 'withdraw',
            args: {
              market: from.marketAddress,
              amount: amount.toString()
            }
          },
          // 2. Deposit into new protocol
          {
            protocol: to.protocol.toLowerCase(),
            action: 'deposit',
            args: {
              market: to.marketAddress,
              amount: amount.toString()
            }
          }
        ],
        {
          headers: {
            'Authorization': `Bearer ${this.ensoApiKey}`
          },
          params: {
            chainId: BASE_CHAIN_ID,
            fromAddress: accountAddress,
            slippage: MAX_SLIPPAGE
          }
        }
      );

      // Execute the bundle transaction using ConsoleKit
      const { data } = bundleResponse.data;
      const tx = await this.consoleKit.coreActions.send(
        BASE_CHAIN_ID,
        accountAddress as Address,
        {
          to: data.to as Address,
          data: data.data,
          value: data.value || '0'
        }
      );

      return {
        success: true,
        transactionHash: tx.hash,
        from: from.protocol,
        to: to.protocol,
        amount: amount.toString()
      };

    } catch (error) {
      console.error('Rebalance execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async monitorRebalanceStatus(txHash: string) {
    try {
      const response = await axios.get(
        `https://api.enso.finance/api/v1/transactions/${txHash}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.ensoApiKey}`
          },
          params: {
            chainId: BASE_CHAIN_ID
          }
        }
      );

      return {
        status: response.data.status,
        confirmations: response.data.confirmations
      };
    } catch (error) {
      console.error('Failed to fetch transaction status:', error);
      throw error;
    }
  }
}