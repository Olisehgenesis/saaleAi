// config/chains.ts
export const CHAIN_CONFIG = {
    BASE: {
      chainId: 8453,
      name: 'Base',
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      rpcUrl: process.env.BASE_RPC_URL
    },
    SWELL: {
      chainId: 1970,
      name: 'Swell',
      usdc: '0xc0b2983A17A5E7f34E0aBcb00F3a77Bf709E2093',
      rpcUrl: process.env.SWELL_RPC_URL
    },
    MODE: {
      chainId: 34443,
      name: 'Mode',
      usdc: '0xd988097fb8612cc24eec14542bc03424c656005f',
      rpcUrl: process.env.MODE_RPC_URL
    }
  } as const;
  
  export const BALANCE_THRESHOLD_PERCENTAGE = 15; // 15% difference triggers rebalancing
  export const MIN_BALANCE_TO_MAINTAIN = '1000000'; // 1 USDC minimum balance
  export const MAX_SLIPPAGE = 1; // 1% max slippage