import { BalanceMaintenanceAgent } from "../agent/balanceAgent";

const agent = new BalanceMaintenanceAgent(
    process.env.OPENAI_API_KEY!,
    process.env.CONSOLE_API_KEY!,
    process.env.CONSOLE_BASE_URL!
  );
  let accountAddress = process.env.EXECUTOR_CLIENT_ID||"0x246c7d9116952378a48d1bf0ee1387909c59d7b2";
  
  // Check and rebalance periodically
 
  (async () => {
    const result = await agent.checkAndRebalance(accountAddress);
    console.log(result);
  })();