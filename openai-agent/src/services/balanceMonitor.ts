// services/balanceMonitor.ts
import { ConsoleKit, Address } from 'brahma-console-kit';
import { ethers } from 'ethers';
import { CHAIN_CONFIG, BALANCE_THRESHOLD_PERCENTAGE } from '../config/chains';

export interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: bigint;
  usdcAddress: string;
}

export class BalanceMonitor {
  private consoleKit: ConsoleKit;

  constructor(consoleKit: ConsoleKit) {
    this.consoleKit = consoleKit;
  }

  async getBalances(accountAddress: string): Promise<ChainBalance[]> {
    const balances: ChainBalance[] = [];

    for (const chain of Object.values(CHAIN_CONFIG)) {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const usdcContract = new ethers.Contract(
        chain.usdc,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );

      const balance = await usdcContract.balanceOf(accountAddress);
      
      balances.push({
        chainId: chain.chainId,
        chainName: chain.name,
        balance: BigInt(balance.toString()),
        usdcAddress: chain.usdc
      });
    }

    return balances;
  }

  calculateImbalances(balances: ChainBalance[]): {
    sourceChain: ChainBalance;
    destinationChain: ChainBalance;
    amountToBridge: bigint;
  }[] {
    const actions: {
      sourceChain: ChainBalance;
      destinationChain: ChainBalance;
      amountToBridge: bigint;
    }[] = [];

    // Calculate average balance
    const totalBalance = balances.reduce(
      (sum, chain) => sum + chain.balance,
      BigInt(0)
    );
    const targetBalance = totalBalance / BigInt(balances.length);
    
    // Find chains that need rebalancing
    const highBalanceChains = balances.filter(
      chain => 
        chain.balance > targetBalance * BigInt(100 + BALANCE_THRESHOLD_PERCENTAGE) / BigInt(100)
    );
    
    const lowBalanceChains = balances.filter(
      chain => 
        chain.balance < targetBalance * BigInt(100 - BALANCE_THRESHOLD_PERCENTAGE) / BigInt(100)
    );

    // Match high balance chains with low balance chains
    for (const sourceChain of highBalanceChains) {
      for (const destChain of lowBalanceChains) {
        const excess = sourceChain.balance - targetBalance;
        const deficit = targetBalance - destChain.balance;
        const amountToBridge = excess < deficit ? excess : deficit;

        if (amountToBridge > 0) {
          actions.push({
            sourceChain,
            destinationChain: destChain,
            amountToBridge
          });
        }
      }
    }

    return actions;
  }

  async checkBalancesAndGetActions(accountAddress: string) {
    const balances = await this.getBalances(accountAddress);
    return this.calculateImbalances(balances);
  }
}