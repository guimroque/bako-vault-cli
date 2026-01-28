# Integration with BakoSafe

This document explains how the CLI integrates with the BakoSafe SDK and how to use both together.

## Overview

The Bako Vault CLI is a serverless alternative to the BakoSafe web application. It uses the same BakoSafe SDK under the hood, ensuring compatibility with vaults created in the web app.

## SDK Compatibility

### Version Requirements

```json
{
  "dependencies": {
    "bakosafe": "^0.0.31",
    "fuels": "^0.100.3"
  }
}
```

### Vault Configuration

The wallet configuration in the CLI matches the SDK's `IPredicateConfig`:

```typescript
// CLI wallet config (wallets/<name>.json)
{
  "config": {
    "SIGNATURES_COUNT": 2,
    "SIGNERS": ["0x...", "0x..."],
    "HASH_PREDICATE": "0x..."
  },
  "version": "0x..."
}

// Equivalent SDK usage
const vault = new Vault(provider, {
  SIGNATURES_COUNT: 2,
  SIGNERS: ["0x...", "0x..."],
  HASH_PREDICATE: "0x..."
}, version);
```

## Using CLI with BakoSafe Web App

### Exporting from Web App

1. Create a vault in BakoSafe web app
2. Copy the vault configuration
3. Create a wallet JSON file with the configuration

### Creating Transactions

Transactions created with the CLI are compatible with BakoSafe:

- Same hash generation algorithm
- Same signature encoding
- Same predicate verification

## SDK Method Mapping

| CLI Operation | SDK Method |
|---------------|------------|
| Create vault instance | `new Vault(provider, config, version)` |
| Create transaction | `vault.transaction({ assets })` |
| Encode signature | `vault.encodeSignature(signer, signature)` |
| Send transaction | `vault.send(tx)` |
| Get balance | `vault.getBalance(assetId)` |
| Get balances | `vault.getBalances()` |

## Code Examples

### Creating a Vault (SDK vs CLI)

**SDK:**
```typescript
import { Provider } from 'fuels';
import { Vault } from 'bakosafe';

const provider = new Provider('https://testnet.fuel.network/v1/graphql');
const vault = new Vault(provider, {
  SIGNATURES_COUNT: 2,
  SIGNERS: ['0x...', '0x...'],
  HASH_PREDICATE: '0x...',
}, '0xversion...');

console.log('Vault address:', vault.address.toB256());
```

**CLI:**
```bash
# Create wallets/my-vault.json with the same config
bako-vault info my-vault -n testnet
# Shows: Address: 0x... (same as SDK)
```

### Creating a Transaction (SDK vs CLI)

**SDK:**
```typescript
const { tx, hashTxId } = await vault.transaction({
  assets: [{
    assetId: '0x...',
    amount: '0.001',
    to: '0xRecipient...',
  }],
});

console.log('Hash to sign:', hashTxId);
```

**CLI:**
```bash
bako-vault create-tx -w my-vault -n testnet -t 0xRecipient -a 0.001
# Shows: Hash to Sign: <same hash>
```

### Signing (SDK vs CLI)

**SDK:**
```typescript
import { Wallet } from 'fuels';

const wallet = Wallet.fromPrivateKey('0x...');
const signature = await wallet.signMessage(hashTxId);
```

**CLI:**
```bash
bako-vault sign -p 0x...
# Produces the same signature
```

### Sending (SDK vs CLI)

**SDK:**
```typescript
const encodedSig = vault.encodeSignature(signer, signature);
tx.witnesses = [encodedSig];

const response = await vault.send(tx);
const result = await response.waitForResult();
```

**CLI:**
```bash
bako-vault sign -p 0x...
# When prompted, select 'Y' to send
# Or use send-tx with explicit signature
```

## Hybrid Workflows

### Create in Web App, Sign with CLI

1. Create transaction in BakoSafe web app
2. Copy the `hashTxId`
3. Sign locally:
   ```bash
   # The sign command uses the pending transaction's hashTxId
   # You can also sign manually:
   fuels wallet sign --message <hashTxId> --private-key <pk>
   ```
4. Submit signature back to web app

### Create with CLI, Monitor in Web App

1. Create and send transaction with CLI
2. Copy the transaction ID
3. View in block explorer linked to BakoSafe

## API Reference

### Vault Class (from BakoSafe SDK)

```typescript
class Vault {
  constructor(
    provider: Provider,
    config: IPredicateConfig,
    version: string
  );

  address: Address;
  version: string;

  async transaction(params: {
    assets: Array<{
      assetId: string;
      amount: string;
      to: string;
    }>;
  }): Promise<{ tx: TransactionRequest; hashTxId: string }>;

  encodeSignature(signer: string, signature: string): string;

  async send(tx: TransactionRequest): Promise<TransactionResponse>;

  async getBalance(assetId: string): Promise<BN>;
  async getBalances(): Promise<{ balances: Array<{ assetId: string; amount: BN }> }>;
}
```

### IPredicateConfig Interface

```typescript
interface IPredicateConfig {
  SIGNATURES_COUNT: number;
  SIGNERS: string[];
  HASH_PREDICATE?: string;
}
```

## Troubleshooting

### "Signature verification failed"

Ensure you're using the same:
- Predicate version
- Signer addresses
- Hash to sign (hashTxId)

### "Vault address mismatch"

The vault address is deterministic based on:
- `SIGNERS` array (order matters!)
- `SIGNATURES_COUNT`
- `HASH_PREDICATE`
- `version`

All must match exactly.

### "Transaction recreation failed"

When sending, the CLI recreates the transaction with the same parameters. Ensure:
- The pending transaction file hasn't been modified
- The network is accessible
- The vault has sufficient balance

## Best Practices

1. **Keep configurations in sync**: If you modify the vault in the web app, update the CLI config
2. **Use the same network**: Don't mix testnet and mainnet configurations
3. **Verify before sending**: Use `wallet-info` to check the vault state
4. **Backup pending transactions**: The `.pending-tx.json` file contains important state
