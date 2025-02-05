// services/bridgeService.ts
import { ConsoleKit, Address } from 'brahma-console-kit';
import { MAX_SLIPPAGE } from '../config/chains';
import type { ChainBalance } from './balanceMonitor';

export class BridgeService {
  private consoleKit: ConsoleKit;

  constructor(consoleKit: ConsoleKit) {
    this.consoleKit = consoleKit;
  }

  async executeBridge(
    accountAddress: string,
    source: ChainBalance,
    destination: ChainBalance,
    amount: bigint
  ) {
    try {
      // Get bridging routes
      const [bridgeRoute] = await this.consoleKit.coreActions.fetchBridgingRoutes({
        amountIn: amount.toString(),
        amountOut: "0",
        chainIdIn: source.chainId,
        chainIdOut: destination.chainId,
        ownerAddress: accountAddress as Address,
        recipient: accountAddress as Address,
        slippage: MAX_SLIPPAGE,
        tokenIn: source.usdcAddress,
        tokenOut: destination.usdcAddress,
      });

      // Execute bridge transaction
      const { data } = await this.consoleKit.coreActions.bridge(
        source.chainId,
        accountAddress as Address,
        {
          amountIn: amount.toString(),
          amountOut: "0",
          chainIdIn: source.chainId,
          chainIdOut: destination.chainId,
          ownerAddress: accountAddress as Address,
          recipient: accountAddress as Address,
          route: bridgeRoute,
          tokenIn: source.usdcAddress as Address,
          tokenOut: destination.usdcAddress as Address,
          slippage: MAX_SLIPPAGE,
        }
      );

      return {
        success: true,
        transactions: data.transactions,
        route: bridgeRoute
      };
    } catch (error) {
      console.error('Bridge execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async monitorBridgeStatus(txHash: string, pid: number, sourceChain: ChainBalance, destChain: ChainBalance) {
    try {
      const status = await this.consoleKit.coreActions.fetchBridgingStatus(
        txHash as `0x${string}`,
        pid,
        sourceChain.chainId,
        destChain.chainId
      );

      return {
        sourceStatus: status?.sourceStatus || 'pending',
        destinationStatus: status?.destinationStatus || 'pending'
      };
    } catch (error) {
      console.error('Failed to fetch bridge status:', error);
      return {
        sourceStatus: 'unknown',
        destinationStatus: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}