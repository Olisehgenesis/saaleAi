// scripts/optimizeYield.ts
import { ConsoleKit } from 'brahma-console-kit';
import { YieldOptimizationAgent } from '../yieldAgent';

const POLLING_INTERVAL = 3600000; // 1 hour

async function main() {
  // Initialize configuration
  const consoleKit = new ConsoleKit(
    process.env.CONSOLE_API_KEY!,
    process.env.CONSOLE_BASE_URL!
  );

  const agent = new YieldOptimizationAgent(
    process.env.OPENAI_API_KEY!,
    process.env.ENSO_API_KEY!,
    consoleKit
  );

  const accountAddress = process.env.WALLET_ADDRESS!;

  console.log('Starting yield optimization monitoring...');

  // Continuous monitoring loop
  while (true) {
    try {
      console.log('\nChecking for yield optimization opportunities...');
      
      // Check and execute rebalancing if needed
      const result = await agent.checkAndRebalance(accountAddress);
      console.log('Optimization check result:', result);

      if (result.status === 'rebalancing_executed' && result.results) {
        // Monitor transaction status for executed rebalances
        for (const rebalance of result.results) {
          if (rebalance.success && rebalance.transactionHash) {
            const status = await agent.monitorAndReport(rebalance.transactionHash);
            console.log('Rebalance transaction status:', status);
          }
        }
      }

      // Analyze performance periodically
      const analysis = await agent.analyzeHistoricalPerformance(accountAddress);
      console.log('Performance analysis:', analysis);

    } catch (error) {
      console.error('Error in optimization loop:', error);
    }

    // Wait for next check
    console.log(`Waiting ${POLLING_INTERVAL/1000/60} minutes until next check...`);
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
}

// Start the optimization process
main().catch(console.error);