// config/protocols.ts
import { Address } from 'brahma-console-kit';

export const BASE_CHAIN_ID = 8453;

export const PROTOCOLS = {
  AAVE: {
    name: 'Aave',
    id: 'aave-v3',
    markets: {
      USDC: {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        pool: '0xe0B015E54d54fc84A6cB9B666099c46adE9335FF'
      },
      // Add other markets as needed
    }
  },
  MORPHO: {
    name: 'Morpho',
    id: 'morpho',
    markets: {
      USDC: {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        pool: '0xc1fc9E5eC3058921eA5025D703CBE31764756319'
      }
    }
  },
  FLUID: {
    name: 'Fluid',
    id: 'fluid',
    markets: {
      USDC: {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        pool: '0x1A5E82708221faD9336f3148D60Bfb9d8A297dE9'
      }
    }
  }
};

export const MIN_APY_DIFFERENCE = 0.5; // 0.5% minimum difference to trigger rebalancing
export const REBALANCE_THRESHOLD = 5000000; // 5 USDC minimum to rebalance
export const MAX_SLIPPAGE = 100; // 1% max slippage