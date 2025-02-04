# Load environment variables if .env exists
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Default values for deployment parameters
CHAIN_ID ?= 8453  # Default to Base
INPUT_TOKEN ?= 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  # Default to Base USDC
INPUT_AMOUNT ?= 1000000  # Default to 1 USDC (6 decimals)
ITERATION_LIMIT ?= 2000000  # Default to 2 USDC per iteration
DURATION ?= 0  # Default duration
AUTOMATION_INTERVAL ?= 60s  # Default interval
RECEIVER ?= 0xAE75B29ADe678372D77A8B41225654138a7E6ff1  # Default receiver
TRANSFER_AMOUNT ?= 200000  # Default transfer amount

# Helper to check required environment variables
check_env:
	@if [ -z "$(USER_EOA_PRIVATE_KEY)" ]; then \
		echo "ERROR: USER_EOA_PRIVATE_KEY is required in .env file"; \
		exit 1; \
	fi
	@if [ -z "$(EXECUTOR_REGISTRY_ID)" ]; then \
		echo "ERROR: EXECUTOR_REGISTRY_ID is required in .env file"; \
		exit 1; \
	fi
	@if [ -z "$(JSON_RPC_URL)" ]; then \
		echo "ERROR: JSON_RPC_URL is required in .env file"; \
		exit 1; \
	fi
	@if [ -z "$(CONSOLE_API_KEY)" ]; then \
		echo "ERROR: CONSOLE_API_KEY is required in .env file"; \
		exit 1; \
	fi
	@if [ -z "$(CONSOLE_BASE_URL)" ]; then \
		echo "ERROR: CONSOLE_BASE_URL is required in .env file"; \
		exit 1; \
	fi

# Basic commands
run-agent:
	cd openai-agent && yarn agent

run-register-executor:
	cd kernel-workflow && yarn register-executor

run-agent-workflow:
	cd kernel-workflow && yarn agent-workflow

# Enhanced deploy-account command with parameter support
run-deploy-account: check_env
	@echo "Deploying automation account with following parameters:"
	@echo "Chain ID: $(CHAIN_ID)"
	@echo "Input Token: $(INPUT_TOKEN)"
	@echo "Input Amount: $(INPUT_AMOUNT)"
	@echo "Iteration Limit: $(ITERATION_LIMIT)"
	@echo "Duration: $(DURATION)"
	@echo "Automation Interval: $(AUTOMATION_INTERVAL)"
	@echo "Receiver: $(RECEIVER)"
	@echo "Transfer Amount: $(TRANSFER_AMOUNT)"
	@cd kernel-workflow && INPUT_TOKEN=$(INPUT_TOKEN) \
		INPUT_AMOUNT=$(INPUT_AMOUNT) \
		ITERATION_LIMIT=$(ITERATION_LIMIT) \
		DURATION=$(DURATION) \
		AUTOMATION_INTERVAL=$(AUTOMATION_INTERVAL) \
		RECEIVER=$(RECEIVER) \
		TRANSFER_AMOUNT=$(TRANSFER_AMOUNT) \
		CHAIN_ID=$(CHAIN_ID) \
		yarn deploy-account

# Deployment presets for different networks


deploy-arbitrum: export CHAIN_ID=42161
deploy-arbitrum: export INPUT_TOKEN=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
deploy-arbitrum: run-deploy-account

deploy-optimism: export CHAIN_ID=10
deploy-optimism: export INPUT_TOKEN=0x7F5c764cBc14f9669B88837ca1490cCa17c31607
deploy-optimism: run-deploy-account

deploy-base: export CHAIN_ID=8453
deploy-base: export INPUT_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
deploy-base: run-deploy-account

deploy-swell: export CHAIN_ID=1970
deploy-swell: export INPUT_TOKEN=0xc0b2983A17A5E7f34E0aBcb00F3a77Bf709E2093
deploy-swell: run-deploy-account

deploy-mode: export CHAIN_ID=34443
deploy-mode: export INPUT_TOKEN=0xd988097fb8612cc24eec14542bc03424c656005f
deploy-mode: run-deploy-account

# Help command
help:
	@echo "Available commands:"
	@echo "  make run-deploy-account [parameters]  - Deploy automation account with custom parameters"
	@echo "  make deploy-base                     - Deploy to Base with default parameters"
	@echo "  make deploy-arbitrum                 - Deploy to Arbitrum with default parameters"
	@echo "  make deploy-optimism                 - Deploy to Optimism with default parameters"
	@echo "  make run-agent                       - Run the OpenAI agent"
	@echo "  make run-register-executor           - Register executor"
	@echo "  make run-agent-workflow             - Run agent workflow"
	@echo ""
	@echo "Available parameters for run-deploy-account:"
	@echo "  CHAIN_ID              - Chain ID (default: 8453 Base)"
	@echo "  INPUT_TOKEN           - Token address"
	@echo "  INPUT_AMOUNT          - Amount of tokens"
	@echo "  ITERATION_LIMIT       - Amount limit per iteration"
	@echo "  DURATION              - Duration in seconds"
	@echo "  AUTOMATION_INTERVAL   - Interval between automations"
	@echo "  RECEIVER              - Receiver address"
	@echo "  TRANSFER_AMOUNT       - Amount to transfer per iteration"
	@echo ""
	@echo "Example:"
	@echo "  make run-deploy-account CHAIN_ID=42161 INPUT_AMOUNT=2000000"

.PHONY: check_env run-agent run-deploy-account run-register-executor run-agent-workflow deploy-base deploy-arbitrum deploy-optimism help