
# Saala AI with ConsoleKit Integration

Welcome to the Saala AI repository! This project showcases how to build autonomous agents for decentralized finance (DeFi) applications using ConsoleKit. By leveraging ConsoleKit, you can seamlessly integrate AI-driven decision-making with secure, on-chain execution. Saala AI focuses on providing intelligent automation and robust security for a variety of DeFi use cases.

## Project Overview

Saala AI is built using ConsoleKit, which provides the necessary infrastructure to connect AI agents with blockchain execution. The system uses Brahma's battle-tested security framework and customizable policy engine to ensure that AI agents can make and execute decisions in a secure and trusted environment.

### Features:
- AI-powered decision-making in DeFi
- Seamless integration with multiple blockchain networks (Base, Swell, Mode)
- Secure on-chain execution using ConsoleKit's smart accounts
- Customizable safety policies for enhanced risk management
- Optimized for autonomous agent functionality (rebalancing, yield farming, cross-chain transfers, etc.)

## Getting Started

To start building your project using Saala AI and ConsoleKit, follow these instructions.

### Step 1: Install Dependencies

Start by cloning the repository and installing the necessary dependencies:

```bash
git clone https://github.com/your-repository/saala-ai.git
cd saala-ai
yarn install
```

### Step 2: Set Up Environment Variables

You’ll need to configure your environment variables to ensure proper integration with ConsoleKit.

1. Copy the environment template file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the required values, such as your API key for ConsoleKit and network configurations.

### Step 3: Running the Agent

Once your environment is set up, you can run the Saala AI agent locally.

#### Example Command:

```bash
make run-saala-ai-agent
```

This will start the agent and allow you to execute actions like:

- Swap tokens between DeFi protocols
- Rebalance positions across platforms like AAVE, Morpho, and Fluid
- Automate cross-chain operations

For more complex workflows, you can modify the logic inside `agent-workflow.ts` or extend it with custom strategies.

### Step 4: Integrating with ConsoleKit

If you wish to interact with ConsoleKit’s core actions (like Swap, Lending, and Bridge), you can use the following functions:

1. **Swap Tokens:** 
   Execute swaps between tokens across multiple networks, leveraging ConsoleKit’s `swapTool`.

2. **Lending Positions:**
   Automate lending positions on platforms like AAVE and Fluid, adjusting the amount based on market conditions.

3. **Cross-Chain Operations:**
   Use the `bridgeTool` to facilitate cross-chain transfers, allowing the agent to move tokens seamlessly between different networks (Base, Swell, Mode).

4. **Enso Finance Integration:**
   Utilize Enso Finance to aggregate liquidity from multiple DeFi protocols and optimize yield farming strategies. Integrate with Enso Shortcuts for efficient and streamlined operations.

## Use Cases for Saala AI

### 1. **Rebalancing DeFi Positions**
Automatically rebalance liquidity positions between different DeFi protocols (AAVE, Fluid, and Morpho) based on current APY rates and risk assessments.

Example:
```bash
> Rebalance positions between AAVE and Morpho based on the current APY and liquidity conditions.
```

### 2. **Cross-Chain Yield Optimization**
Maximize yield by optimizing token placement between DeFi protocols on different chains (Base, Swell, Mode), using ConsoleKit’s cross-chain capabilities.

Example:
```bash
> Optimize token yield between Base and Mode by moving liquidity to the highest-earning platform.
```

### 3. **Smart Account Automation**
Use Saala AI for treasury management, automatically transferring funds between platforms, or processing multi-step DeFi transactions with safety checks.

Example:
```bash
> Automate treasury management by distributing salaries based on predefined conditions and schedules.
```

### 4. **Enso Finance Integration for Yield Farming**
Aggregate liquidity across protocols using Enso Finance’s optimized yield strategies, improving yield farming efficiency.

Example:
```bash
> Leverage Enso Shortcuts for multi-protocol yield farming between Base, Morpho, and AAVE.
```

---

## Join the Community

- **Brahma Discord:** Get help and engage with other developers: [Discord Link](https://discord.com/invite/khXHEnvS6N)
- **Brahma Builders Telegram:** Join the Brahma Builders group for support: [Telegram Link](https://t.me/+O5fFUPVBFvU3ZjY1)

## Additional Resources

- [ConsoleKit Documentation](https://github.com/Brahma-fi/console-kit)
- [ConsoleKit SDK](https://www.npmjs.com/package/brahma-console-kit)
- [Scaffold Agent Repository](https://github.com/Brahma-fi/scaffold-agent)
- [Brahma Builder](https://github.com/Brahma-fi/brahma-builder)

---

Start building with Saala AI and take your DeFi agents to the next level! 🚀

