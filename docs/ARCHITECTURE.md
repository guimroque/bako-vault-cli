# Architecture

This document describes the architecture of the Bako Vault CLI.

## Overview

```
bako-vault-cli/
├── src/
│   ├── index.ts              # CLI entry point (Commander.js)
│   ├── types.ts              # TypeScript type definitions
│   ├── commands/             # CLI command implementations
│   │   ├── list-wallets.ts   # List configured wallets
│   │   ├── list-networks.ts  # List configured networks
│   │   ├── wallet-info.ts    # Display wallet details
│   │   ├── create-tx.ts      # Create new transaction
│   │   ├── send-tx.ts        # Send transaction with signatures
│   │   ├── sign.ts           # Sign pending transaction
│   │   └── balances.ts       # Show all balances
│   ├── services/             # Business logic layer
│   │   ├── vault.ts          # BakoSafe Vault operations
│   │   └── transaction.ts    # Transaction create/send logic
│   └── utils/                # Utility functions
│       └── config.ts         # Configuration file management
├── wallets/                  # Wallet configuration files
├── networks/                 # Network configuration files
├── docs/                     # Documentation
└── package.json
```

## Components

### Entry Point (`src/index.ts`)

The main CLI entry point using Commander.js. Defines all available commands and their options.

### Commands (`src/commands/`)

Each command is a separate module with a single exported async function:

- **list-wallets**: Lists all wallet JSON files from `wallets/` directory
- **list-networks**: Lists all network JSON files from `networks/` directory
- **wallet-info**: Displays detailed wallet information including address, signers, and balances
- **create-tx**: Creates a new transaction and saves it as pending
- **send-tx**: Sends a pending transaction with provided signatures
- **sign**: Signs the pending transaction using a private key
- **balances**: Displays balances for all wallets across all networks

### Services (`src/services/`)

Business logic layer that interacts with the BakoSafe SDK:

#### `vault.ts`
- `createVaultInstance()`: Creates a BakoSafe Vault instance from configuration
- `getVaultInfo()`: Gets vault address, signers, and balance
- `getVaultBalances()`: Gets all asset balances for a vault

#### `transaction.ts`
- `createTransaction()`: Creates a new transaction and saves it as pending
- `sendTransaction()`: Sends a transaction with encoded signatures

### Utils (`src/utils/`)

#### `config.ts`
Configuration file management:
- `loadWalletConfig()`: Loads wallet configuration from JSON
- `loadNetworkConfig()`: Loads network configuration from JSON
- `savePendingTransaction()`: Saves pending transaction to `.pending-tx.json`
- `loadPendingTransaction()`: Loads the pending transaction
- `deletePendingTransaction()`: Removes the pending transaction file

### Types (`src/types.ts`)

TypeScript interfaces for all data structures:

```typescript
interface WalletConfig {
  name: string;
  config: PredicateConfigurable;
  version: string;
}

interface NetworkConfig {
  name: string;
  url: string;
  assets: NetworkAssets;
  explorerUrl?: string;
}

interface PendingTransaction {
  walletName: string;
  networkName: string;
  hashTxId: string;
  transaction: TransactionInput;
  signatures: string[];
  requiredSignatures: number;
}
```

## Data Flow

### Transaction Creation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   create-tx     │────▶│   transaction   │────▶│   BakoSafe      │
│   command       │     │   service       │     │   SDK           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ .pending-tx.json│
                        └─────────────────┘
```

### Transaction Signing Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   sign          │────▶│   Fuel Wallet   │────▶│ Signature       │
│   command       │     │   signMessage   │     │ (raw)           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ Threshold check │
                        └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌───────────────┐     ┌───────────────┐
            │ Save to       │     │ Send          │
            │ pending       │     │ transaction   │
            └───────────────┘     └───────────────┘
```

### Transaction Sending Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   sendTx        │────▶│   Recreate TX   │────▶│ Encode          │
│                 │     │   (same params) │     │ signatures      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
                                                ┌─────────────────┐
                                                │ vault.send(tx)  │
                                                └─────────────────┘
                                                       │
                                                       ▼
                                                ┌─────────────────┐
                                                │ Delete pending  │
                                                └─────────────────┘
```

## Configuration Files

### Wallet Configuration

Stored in `wallets/<name>.json`:

```json
{
  "config": {
    "SIGNATURES_COUNT": 2,
    "SIGNERS": [
      "0x...",
      "0x..."
    ],
    "HASH_PREDICATE": "0x..."
  },
  "version": "0x..."
}
```

### Network Configuration

Stored in `networks/<name>.json`:

```json
{
  "url": "https://testnet.fuel.network/v1/graphql",
  "explorerUrl": "https://app-testnet.fuel.network",
  "assets": {
    "ETH": "0x...",
    "USDC": "0x..."
  }
}
```

### Pending Transaction

Stored in `.pending-tx.json` (root directory):

```json
{
  "walletName": "my-vault",
  "networkName": "testnet",
  "hashTxId": "0x...",
  "transaction": {
    "to": "0x...",
    "amount": "0.001"
  },
  "signatures": [],
  "requiredSignatures": 2,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `bakosafe` | BakoSafe SDK for vault operations |
| `fuels` | Fuel TypeScript SDK |
| `commander` | CLI framework |
| `inquirer` | Interactive prompts |
| `chalk` | Terminal styling |
| `ora` | Loading spinners |

## Security Considerations

1. **Private Keys**: Never stored - only used temporarily for signing
2. **Pending Transactions**: Stored locally, can only be sent with valid signatures
3. **Configuration Files**: Should not contain sensitive data (only public addresses)
