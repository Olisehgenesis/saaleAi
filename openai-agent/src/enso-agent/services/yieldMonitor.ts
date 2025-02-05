// services/yieldMonitor.ts
import axios from 'axios';
import { ConsoleKit, Address } from 'brahma-console-kit';
import { PROTOCOLS, BASE_CHAIN_ID, MIN_APY_DIFFERENCE } from '../config/protocols';

export interface YieldData {
  protocol: string;
  apy: number;
  tvl: string;
  marketAddress: string;
  tokenAddress: string;
}

export class YieldMonitor {
  private ensoApiKey: string;
  private consoleKit: ConsoleKit;

  constructor(ensoApiKey: string, consoleKit: ConsoleKit) {
    this.ensoApiKey = ensoApiKey;
    this.consoleKit = consoleKit;
  }

  async fetchProtocolYields(): Promise<YieldData[]> {
    const yields: YieldData[] = [];
    
    try {
      // Fetch yields from Enso API for each protocol
      for (const [protocolKey, protocol] of Object.entries(PROTOCOLS)) {
        const response = await axios.get(
          `https://api.enso.finance/api/v1/protocols/${protocol.id}/yields`,
          {
            headers: {
              'Authorization': `Bearer ${this.ensoApiKey}`
            },
            params: {
              chainId: BASE_CHAIN_ID
            }
          }
        );

        // Extract and format yield data
        for (const [marketKey, market] of Object.entries(protocol.markets)) {
          const marketData = response.data.markets.find(
            (m: any) => m.address.toLowerCase() === market.pool.toLowerCase()
          );

          if (marketData) {
            yields.push({
              protocol: protocolKey,
              apy: marketData.apy,
              tvl: marketData.tvl,
              marketAddress: market.pool,
              tokenAddress: market.token
            });
          }
        }
      }

      return yields;
    } catch (error) {
      console.error('Error fetching yields:', error);
      throw error;
    }
  }

  findBestYield(yields: YieldData[]): YieldData {
    return yields.reduce((best, current) => 
      current.apy > best.apy ? current : best
    );
  }

  calculateRebalanceOpportunities(
    currentPositions: Map<string, bigint>,
    yields: YieldData[]
  ): {
    from: YieldData;
    to: YieldData;
    amount: bigint;
  }[] {
    const opportunities = [];
    const bestYield = this.findBestYield(yields);

    for (const [protocolKey, amount] of currentPositions.entries()) {
      const currentYield = yields.find(y => y.protocol === protocolKey);
      if (currentYield && 
          bestYield.protocol !== currentYield.protocol &&
          bestYield.apy - currentYield.apy >= MIN_APY_DIFFERENCE) {
        opportunities.push({
          from: currentYield,
          to: bestYield,
          amount
        });
      }
    }

    return opportunities;
  }

  async getCurrentPositions(accountAddress: string): Promise<Map<string, bigint>> {
    const positions = new Map<string, bigint>();

    for (const [protocolKey, protocol] of Object.entries(PROTOCOLS)) {
      for (const market of Object.values(protocol.markets)) {
        // Use Enso API to fetch positions
        const response = await axios.get(
          `https://api.enso.finance/api/v1/protocols/${protocol.id}/positions`,
          {
            headers: {
              'Authorization': `Bearer ${this.ensoApiKey}`
            },
            params: {
              chainId: BASE_CHAIN_ID,
              address: accountAddress
            }
          }
        );

        const position = response.data.positions.find(
          (p: any) => p.market.toLowerCase() === market.pool.toLowerCase()
        );

        if (position) {
          positions.set(protocolKey, BigInt(position.balance));
        }
      }
    }

    return positions;
  }
}