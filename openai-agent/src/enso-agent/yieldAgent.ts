import OpenAI from "openai";
import { ConsoleKit } from 'brahma-console-kit';
import { YieldMonitor } from './services/yieldMonitor';
import { RebalanceService } from './services/rebalanceService';
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class YieldOptimizationAgent {
  private openai: OpenAI;
  private yieldMonitor: YieldMonitor;
  private rebalanceService: RebalanceService;

  constructor(
    openaiApiKey: string,
    ensoApiKey: string,
    consoleKit: ConsoleKit
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.yieldMonitor = new YieldMonitor(ensoApiKey, consoleKit);
    this.rebalanceService = new RebalanceService(ensoApiKey, consoleKit);
  }

  private async getAIRebalanceDecision(
    opportunities: any[],
    yields: any[],
    currentPositions: any,
    chatHistory: ChatCompletionMessageParam[] = []
  ) {
    const prompt = `
Current yield landscape:
${JSON.stringify(yields, null, 2)}

Current positions:
${JSON.stringify(Object.fromEntries(currentPositions), null, 2)}

Potential rebalancing opportunities:
${JSON.stringify(opportunities, null, 2)}

Should we proceed with these rebalancing actions? Consider:
1. Gas costs vs potential yield increase
2. Protocol risks
3. Historical APY volatility
4. Size of positions
5. Previous rebalancing actions

Respond with a clear YES or NO and explanation for each opportunity.`;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are an AI assistant optimizing yield farming positions across Aave, Morpho, and Fluid protocols on Base.",
      },
      ...chatHistory,
      { role: "user", content: prompt },
    ];

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
    });

    return {
      decisions: opportunities.map(opp => ({
        opportunity: opp,
        approved: response.choices[0].message.content?.includes(`YES for ${opp.from.protocol} to ${opp.to.protocol}`)
      })),
      reasoning: response.choices[0].message.content
    };
  }

  async checkAndRebalance(accountAddress: string) {
    try {
      // 1. Get current yields
      const yields = await this.yieldMonitor.fetchProtocolYields();
      
      // 2. Get current positions
      const positions = await this.yieldMonitor.getCurrentPositions(accountAddress);
      
      // 3. Calculate rebalancing opportunities
      const opportunities = this.yieldMonitor.calculateRebalanceOpportunities(positions, yields);

      if (opportunities.length === 0) {
        return {
          status: 'no_action_needed',
          message: 'No profitable rebalancing opportunities found'
        };
      }

      // 4. Get AI decisions on rebalancing
      const { decisions, reasoning } = await this.getAIRebalanceDecision(
        opportunities,
        yields,
        positions
      );

      // 5. Execute approved rebalances
      const results = [];
      for (const { opportunity, approved } of decisions) {
        if (approved) {
          const result = await this.rebalanceService.executeRebalance(
            accountAddress,
            opportunity.from,
            opportunity.to,
            opportunity.amount
          );
          results.push(result);
        }
      }

      return {
        status: 'rebalancing_executed',
        results,
        aiReasoning: reasoning
      };

    } catch (error) {
      console.error('Yield optimization failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async monitorAndReport(txHash: string) {
    try {
      const status = await this.rebalanceService.monitorRebalanceStatus(txHash);
      return status;
    } catch (error) {
      console.error('Status monitoring failed:', error);
      throw error;
    }
  }

  async analyzeHistoricalPerformance(accountAddress: string) {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are analyzing historical yield farming performance across protocols."
      },
      {
        role: "user",
        content: "Analyze the performance and suggest strategy adjustments."
      }
    ];

    try {
      // Get historical yields data
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages
      });

      return {
        analysis: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Performance analysis failed:', error);
      throw error;
    }
  }

  async getRiskAssessment(protocols: string[]) {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are assessing the risk levels of different DeFi protocols."
      },
      {
        role: "user",
        content: `Assess the current risk levels for these protocols: ${protocols.join(', ')}`
      }
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages
      });

      return {
        riskAssessment: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Risk assessment failed:', error);
      throw error;
    }
  }

  async getOptimalRebalanceTime(
    currentYields: any[],
    historicalYields: any[],
    gasCosts: any
  ) {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are determining the optimal time to perform yield rebalancing."
      },
      {
        role: "user",
        content: `Analyze current yields, historical patterns, and gas costs to determine optimal rebalancing time:\n
          Current Yields: ${JSON.stringify(currentYields)}\n
          Historical Yields: ${JSON.stringify(historicalYields)}\n
          Gas Costs: ${JSON.stringify(gasCosts)}`
      }
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages
      });

      return {
        recommendation: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Timing optimization failed:', error);
      throw error;
    }
  }
}
