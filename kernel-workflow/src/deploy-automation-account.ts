import {
  ConsoleKit,
  PreComputedAddressData,
  TaskStatusData,
  Address
} from "brahma-console-kit";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { erc20Abi, fromHex } from "viem";
import { poll } from "./utils";

// Network Configuration
const getRpcChainId = async (rpcUrl: string): Promise<number> => {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const { chainId } = await provider.getNetwork();
    return Number(chainId);
  } catch (error) {
    console.error("Failed to get chain ID from RPC:", error);
    throw new Error("Could not determine chain ID from RPC URL");
  }
};

// USDC address map
const USDC_ADDRESSES: { [key: number]: string } = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  // Base
  1970: "0xc0b2983A17A5E7f34E0aBcb00F3a77Bf709E2093",  // Swell
  34443: "0xd988097fb8612cc24eec14542bc03424c656005f"   // Mode
};

// Required environment variables
const UserEoaPK = process.env.USER_EOA_PRIVATE_KEY!;
const ExecutorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;

// Configurable parameters with defaults
const AutomationSubscriptionParams = {
  inputToken: process.env.INPUT_TOKEN as Address, // Will be set based on chain ID
  inputAmount: BigInt(process.env.INPUT_AMOUNT || "1000000"), // Default to 1 USDC
  inputTokenPerIterationLimit: BigInt(process.env.ITERATION_LIMIT || "2000000"), // Default to 2 USDC
  duration: parseInt(process.env.DURATION || "0", 10),
  metadata: {
    every: process.env.AUTOMATION_INTERVAL || "60s",
    receiver: (process.env.RECEIVER || 
      "0xAE75B29ADe678372D77A8B41225654138a7E6ff1") as Address,
    transferAmount: process.env.TRANSFER_AMOUNT || "200000"
  }
};

const setupPrecomputeBalances = async (
  _consoleKit: ConsoleKit,
  _provider: JsonRpcProvider,
  _userWallet: Wallet,
  _userEoa: Address,
  _chainId: number,
  _inputToken: Address,
  _inputAmount: bigint
) => {
  console.log("[setup] Fetching precompute data...");
  const precomputedData = await _consoleKit.publicDeployer.fetchPreComputeData(
    _userEoa,
    _chainId,
    _inputToken
  );
  if (!precomputedData) throw new Error("Precompute call failed");

  const totalDepositAmount = BigInt(precomputedData.feeEstimate) + _inputAmount;

  try {
    console.log("[setup] Setting up token balances...");
    const inputTokenContract = new ethers.Contract(
      _inputToken,
      erc20Abi,
      _userWallet
    );

    const tx = await _userWallet.sendTransaction({
      to: await inputTokenContract.getAddress(),
      value: 0,
      data: inputTokenContract.interface.encodeFunctionData("transfer", [
        precomputedData.precomputedAddress,
        totalDepositAmount
      ])
    });
    await tx.wait(2);
    console.log("[setup] Token transfer complete");
  } catch (e) {
    console.error("[error] Setup balance failed:", e);
    throw new Error("Failed to setup balance");
  }

  console.log("[precompute]", { precomputedData });
  return precomputedData;
};

const signAndDeployAutomationAccount = async (
  _consoleKit: ConsoleKit,
  _provider: JsonRpcProvider,
  _userWallet: Wallet,
  _userEoa: Address,
  _chainId: number,
  _precomputeData: PreComputedAddressData,
  _executorRegistryId: string,
  _inputToken: Address,
  _inputAmount: bigint,
  _inputTokenPerIterationLimit: bigint,
  _automationDuration: number
) => {
  console.log("[deploy] Initializing deployment...");
  const inputTokenContract = new ethers.Contract(
    _inputToken,
    erc20Abi,
    _userWallet
  );
  const inputTokenDecimals = await inputTokenContract.decimals();

  const tokens = [_inputToken];
  const amounts = [_inputAmount.toString()];

  const tokenInputs = {
    [_inputToken]: _inputAmount.toString()
  };
  const tokenLimits = {
    [_inputToken]: ethers.formatUnits(_inputAmount, inputTokenDecimals)
  };

  const automationDuration =
    _automationDuration > 3600
      ? _automationDuration - 3600
      : _automationDuration;

  console.log("[deploy] Generating automation sub-account...");
  const accountGenerationData =
    await _consoleKit.publicDeployer.generateAutomationSubAccount(
      _userEoa,
      _precomputeData.precomputedAddress,
      _chainId,
      _executorRegistryId,
      _inputToken,
      _precomputeData.feeEstimate,
      tokens,
      amounts,
      {
        duration: automationDuration,
        tokenInputs: tokenInputs,
        tokenLimits: tokenLimits
      },
      AutomationSubscriptionParams.metadata
    );
  if (!accountGenerationData)
    throw new Error("Failed to generate automation account");

  const {
    signaturePayload: { domain, message, types },
    subAccountPolicyCommit,
    subscriptionDraftID
  } = accountGenerationData;

  console.log("[deploy] Signing deployment data...");
  const deploymentSignature = await _userWallet.signTypedData(
    {
      verifyingContract: domain.verifyingContract,
      chainId: fromHex(domain.chainId as Address, "number")
    },
    types,
    message
  );
  console.log("[dep-signature]", deploymentSignature);

  console.log("[deploy] Deploying Brahma account...");
  const deployData = await _consoleKit.publicDeployer.deployBrahmaAccount(
    _userEoa,
    _chainId,
    _executorRegistryId,
    subscriptionDraftID,
    subAccountPolicyCommit,
    _inputToken,
    tokens,
    amounts,
    deploymentSignature,
    _precomputeData.feeEstimateSignature,
    _precomputeData.feeEstimate,
    {}
  );
  if (!deployData) throw new Error("Failed to deploy automation account");

  console.log("[deploy-init]", deployData.taskId);
  return deployData;
};

const pollDeploymentStatus = async (
  _consoleKit: ConsoleKit,
  _deploymentTaskId: string,
  _chainId: number
) => {
  console.log("[status] Polling deployment status...");
  const isTaskComplete = (taskStatus: TaskStatusData) =>
    !(
      taskStatus.status === "successful" ||
      taskStatus.status === "cancelled" ||
      taskStatus.status === "failed"
    );
  
  const getTaskStatus = async () => {
    const taskStatus = await _consoleKit.publicDeployer.fetchDeploymentStatus(
      _deploymentTaskId
    );
    console.log({ taskStatus });
    return taskStatus;
  };

  const taskStatus = await poll<TaskStatusData>(
    getTaskStatus,
    isTaskComplete,
    5000
  );

  if (taskStatus.outputTransactionHash)
    await _consoleKit.coreActions.indexTransaction(
      taskStatus.outputTransactionHash,
      _chainId
    );

  return taskStatus;
};

// Validate environment variables
const validateEnvironment = () => {
  const required = [
    "USER_EOA_PRIVATE_KEY",
    "EXECUTOR_REGISTRY_ID",
    "JSON_RPC_URL",
    "CONSOLE_API_KEY",
    "CONSOLE_BASE_URL"
  ];

  const missing = required.filter(env => !process.env[env]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  try {
    new URL(JsonRpcUrl);
  } catch (e) {
    throw new Error("Invalid JSON_RPC_URL format");
  }
};

(async () => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Get chain ID from RPC URL
    const chainId = await getRpcChainId(JsonRpcUrl);
    const usdcAddress = USDC_ADDRESSES[chainId] || USDC_ADDRESSES[8453]; // Default to Base USDC if chain not found
    
    // Set input token based on chain ID
    AutomationSubscriptionParams.inputToken = (process.env.INPUT_TOKEN || usdcAddress) as Address;

    console.log("Network Deployment Configuration:");
    console.log("-------------------------------------");
    console.log(`Chain ID: ${chainId} (detected from RPC)`);
    console.log(`USDC Address: ${usdcAddress}`);
    console.log(`Input Amount: ${AutomationSubscriptionParams.inputAmount} (${
      Number(AutomationSubscriptionParams.inputAmount) / 1_000_000
    } USDC)`);
    console.log(`Iteration Limit: ${AutomationSubscriptionParams.inputTokenPerIterationLimit} (${
      Number(AutomationSubscriptionParams.inputTokenPerIterationLimit) / 1_000_000
    } USDC)`);
    console.log(`Duration: ${AutomationSubscriptionParams.duration}`);
    console.log(`Automation Interval: ${AutomationSubscriptionParams.metadata.every}`);
    console.log(`Receiver: ${AutomationSubscriptionParams.metadata.receiver}`);
    console.log(`Transfer Amount: ${AutomationSubscriptionParams.metadata.transferAmount}`);
    console.log("-------------------------------------");

    const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);
    const provider = new ethers.JsonRpcProvider(JsonRpcUrl);
    const userWallet = new ethers.Wallet(UserEoaPK, provider);
    const userEoaAddress = ethers.computeAddress(UserEoaPK) as Address;

    // Verify chain ID matches
    const { chainId: networkChainId } = await provider.getNetwork();
    const actualChainId = parseInt(networkChainId.toString(), 10);
    
    if (actualChainId !== chainId) {
      throw new Error(
        `Chain ID mismatch. RPC reports ${actualChainId}, but detected ${chainId} from URL`
      );
    }

    // Ensure USDC address exists for this chain
    if (!USDC_ADDRESSES[chainId]) {
      console.warn(`Warning: No known USDC address for chain ${chainId}, using Base USDC address`);
    }

    console.log("[init] Setting up precompute balances...");
    const precomputeData = await setupPrecomputeBalances(
      consoleKit,
      provider,
      userWallet,
      userEoaAddress,
      chainId,
      AutomationSubscriptionParams.inputToken,
      AutomationSubscriptionParams.inputAmount
    );

    console.log("[init] Deploying automation account...");
    const { taskId } = await signAndDeployAutomationAccount(
      consoleKit,
      provider,
      userWallet,
      userEoaAddress,
      chainId,
      precomputeData,
      ExecutorRegistryId,
      AutomationSubscriptionParams.inputToken,
      AutomationSubscriptionParams.inputAmount,
      AutomationSubscriptionParams.inputTokenPerIterationLimit,
      AutomationSubscriptionParams.duration
    );

    console.log("[init] Waiting for deployment completion...");
    const taskData = await pollDeploymentStatus(consoleKit, taskId, chainId);
    console.log("[complete] Deployment finished:", { taskData });
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
})();