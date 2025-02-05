// agent/balanceAgent.ts
import OpenAI from "openai";
import { ConsoleKit } from 'brahma-console-kit';
import { BalanceMonitor } from '../services/balanceMonitor';
import { BridgeService } from '../services/bridgeService';
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class BalanceMaintenanceAgent {
  private openai: OpenAI;
  private consoleKit: ConsoleKit;
  private balanceMonitor: BalanceMonitor;
  private bridgeService: BridgeService;

  constructor(
    openaiApiKey: string,
    consoleApiKey: string,
    consoleBaseUrl: string
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.consoleKit = new ConsoleKit(consoleApiKey, consoleBaseUrl);
    this.balanceMonitor = new BalanceMonitor(this.consoleKit);
    this.bridgeService = new BridgeService(this.consoleKit);
  }

  private async getAIDecision(
    balances: any[],
    proposedActions: any[],
    chatHistory: ChatCompletionMessageParam[] = []
  ) {
    const prompt = `
Current balances across chains:
${JSON.stringify(balances, null, 2)}

Proposed rebalancing actions:
${JSON.stringify(proposedActions, null, 2)}

Should we proceed with these rebalancing actions? Consider:
1. Transaction costs vs benefit
2. Current network conditions
3. Size of imbalances
4. Previous actions in chat history

Respond with a clear YES or NO and explanation.`;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are an AI assistant helping to maintain balanced token holdings across different blockchain networks.",
      },
      ...chatHistory,
      { role: "user", content: prompt },
    ];

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
    });

    return {
      decision: response.choices[0].message.content?.includes('YES'),
      reasoning: response.choices[0].message.content
    };
  }

  async checkAndRebalance(accountAddress: string) {
    try {
      // Get current balances and calculate required actions
      const balances = await this.balanceMonitor.getBalances(accountAddress);
      const actions = this.balanceMonitor.calculateImbalances(balances);

      if (actions.length === 0) {
        return {
          status: 'no_action_needed',
          message: 'Balances are within acceptable ranges'
        };
      }

      // Get AI decision on whether to proceed
      const { decision, reasoning } = await this.getAIDecision(balances, actions);

      if (!decision) {
        return {
          status: 'ai_declined',
          message: reasoning
        };
      }

      // Execute approved rebalancing actions
      const results = [];
      for (const action of actions) {
        const bridgeResult = await this.bridgeService.executeBridge(
          accountAddress,
          action.sourceChain,
          action.destinationChain,
          action.amountToBridge
        );

        results.push({
          action,
          result: bridgeResult
        });
      }

      return {
        status: 'rebalancing_executed',
        actions: results,
        aiReasoning: reasoning
      };

    } catch (error) {
      console.error('Rebalancing failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}