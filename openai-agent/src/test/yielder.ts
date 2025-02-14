import { config } from "dotenv";
import { YieldOptimizationAgent } from "../enso-agent/yieldAgent"

import { ConsoleKit } from "brahma-console-kit";

// Load environment variables from .env file
config();

async function runTests() {
  console.log("Starting tests for YieldOptimizationAgent...");

  // Get environment variables
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const ensoApiKey = process.env.ENSO_API_KEY;
  const walletAddress = process.env.WALLET_ADDRESS;
  const consoleKitApiKey = process.env.CONSOLE_API_KEY;
  const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;



  if (!openaiApiKey || !ensoApiKey || !walletAddress || !consoleKitApiKey) {
    console.error("Missing required environment variables. Please check your .env file.");
    return;
  }

  // Initialize ConsoleKit and YieldOptimizationAgent
  const consoleKit = new ConsoleKit(consoleKitApiKey, ConsoleBaseUrl);
  const agent = new YieldOptimizationAgent(openaiApiKey, ensoApiKey, consoleKit);

  // Test: Check and Rebalance
  console.log("\nTest: checkAndRebalance");
  try {
    const rebalanceResult = await agent.checkAndRebalance(walletAddress);
    console.log("Rebalance Result:", rebalanceResult);
  } catch (error) {
    console.error("checkAndRebalance failed:", error);
  }

  // Test: Estimate Gas Costs
  console.log("\nTest: estimateGasCosts");
  try {
    const opportunities = [
      { from: { protocol: "Aave", amount: 100 }, to: { protocol: "Morpho" }, amount: 100 },
    ];
    const gasCosts = await agent.estimateGasCosts(opportunities);
    console.log("Gas Costs:", gasCosts);
  } catch (error) {
    console.error("estimateGasCosts failed:", error);
  }

  // Test: Risk Assessment
  console.log("\nTest: getRiskAssessment");
  try {
    const riskAssessment = await agent.getRiskAssessment(["Aave", "Morpho", "Compound"]);
    console.log("Risk Assessment:", riskAssessment);
  } catch (error) {
    console.error("getRiskAssessment failed:", error);
  }

  // Test: Analyze Historical Performance
  console.log("\nTest: analyzeHistoricalPerformance");
  try {
    const analysis = await agent.analyzeHistoricalPerformance(walletAddress);
    console.log("Historical Performance Analysis:", analysis);
  } catch (error) {
    console.error("analyzeHistoricalPerformance failed:", error);
  }

  // Test: Optimal Rebalance Time
  console.log("\nTest: getOptimalRebalanceTime");
  try {
    const currentYields = [{ protocol: "Aave", yield: 0.05 }];
    const historicalYields = [{ protocol: "Aave", yield: 0.04 }];
    const gasCosts = [{ protocol: "Aave", gasCost: 0.01 }];
    const optimalTime = await agent.getOptimalRebalanceTime(currentYields, historicalYields, gasCosts);
    console.log("Optimal Rebalance Time:", optimalTime);
  } catch (error) {
    console.error("getOptimalRebalanceTime failed:", error);
  }

  console.log("\nTests completed.");
}

runTests().catch((err) => console.error("Test script encountered an error:", err));
