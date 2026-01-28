# CLAUDE.md - Project Context for AI Assistants

This file provides context for AI assistants (like Claude) working on this codebase.

## Project Overview

**Bako Vault CLI** is a command-line tool for executing transactions using BakoSafe predicates on the Fuel network without requiring a server.

### Purpose

- Serverless alternative to BakoSafe web application
- Execute multi-signature transactions from the command line
- Compatible with vaults created in BakoSafe UI

### Key Technology

- **Fuel Network**: UTXO-based blockchain with predicates
- **BakoSafe SDK**: Library for interacting with predicate-based vaults
- **Predicates**: Smart contracts that validate spending conditions

## Architecture

```
src/
├── index.ts              # CLI entry point (Commander.js)
├── types.ts              # TypeScript interfaces
├── commands/             # Command implementations
│   ├── list-wallets.ts
│   ├── list-networks.ts
│   ├── wallet-info.ts
│   ├── create-tx.ts
│   ├── send-tx.ts
│   ├── sign.ts
│   └── balances.ts
├── services/             # Business logic
│   ├── vault.ts          # Vault operations
│   └── transaction.ts    # Transaction create/send
└── utils/
    └── config.ts         # Configuration management
```

## Critical Implementation Details

### Amount Format

The BakoSafe SDK expects amounts as **decimal strings**, not base units:

```typescript
// CORRECT
amount: '0.001'  // Means 0.001 ETH

// WRONG
amount: '1000'   // Would mean 1000 ETH, not 1000 base units!
```

### Transaction Flow

1. **Create**: `vault.transaction()` returns `{ tx, hashTxId }`
2. **Sign**: `wallet.signMessage(hashTxId)` - sign the hash directly
3. **Encode**: `vault.encodeSignature(signer, signature)`
4. **Send**: `tx.witnesses = [encodedSig]; vault.send(tx)`

### Signature Encoding

Signatures must be encoded before setting as witnesses:

```typescript
const encodedSig = vault.encodeSignature(signerAddress, rawSignature);
tx.witnesses = [encodedSig];
```

### Pending Transaction

Only one pending transaction at a time, stored in `.pending-tx.json`:

```json
{
  "walletName": "my-vault",
  "networkName": "testnet",
  "hashTxId": "...",
  "transaction": { "to": "...", "amount": "0.001" },
  "signatures": [],
  "requiredSignatures": 2
}
```

## Common Tasks

### Adding a New Command

1. Create `src/commands/<command>.ts`
2. Export an async function
3. Register in `src/index.ts`
4. Add JSDoc documentation

### Modifying Transaction Logic

Key files:
- `src/services/transaction.ts` - create/send logic
- `src/services/vault.ts` - vault instance creation
- `src/commands/sign.ts` - signing logic

### Configuration

- Wallets: `wallets/<name>.json`
- Networks: `networks/<name>.json`
- Pending TX: `.pending-tx.json`

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `bakosafe` | ^0.0.31 | BakoSafe SDK |
| `fuels` | ^0.100.3 | Fuel TypeScript SDK |
| `commander` | ^12 | CLI framework |
| `inquirer` | ^9 | Interactive prompts |
| `chalk` | ^5 | Terminal styling |
| `ora` | ^8 | Loading spinners |

## Testing

```bash
# Create a test transaction
npm run dev -- create-tx -w carteira-pessoal-fuel -n testnet -t 0x... -a 0.000001

# Sign and send
npm run dev -- sign -p 0x...
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `PredicateVerificationFailed` | Wrong signature/encoding | Verify hashTxId signing |
| `InsufficientBalance` | Not enough funds | Check with `balances` command |
| `OutOfGas` | Usually signature issue | Check witness encoding |

## Code Style

- All code in English
- JSDoc comments on all exported functions
- Interfaces documented with `@interface`
- File-level `@fileoverview` and `@module` tags

## Related Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design
- [docs/COMMANDS.md](./docs/COMMANDS.md) - Command reference
- [docs/TRANSACTION-FLOW.md](./docs/TRANSACTION-FLOW.md) - TX details
- [docs/INTEGRATION.md](./docs/INTEGRATION.md) - SDK integration
