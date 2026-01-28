# Transaction Flow

This document explains how transactions work in the Bako Vault CLI.

## Overview

The transaction flow follows the BakoSafe SDK pattern for predicate-based multi-signature wallets:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Create    │────▶│    Sign     │────▶│   Encode    │────▶│    Send     │
│     TX      │     │   (N times) │     │  Witnesses  │     │     TX      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Step 1: Create Transaction

When you run `create-tx`, the CLI:

1. **Loads configurations** from wallet and network files
2. **Creates a Vault instance** using BakoSafe SDK
3. **Builds the transaction** with the specified parameters
4. **Saves the pending transaction** to `.pending-tx.json`

### Code Flow

```typescript
// 1. Create vault instance
const vault = new Vault(provider, config, version);

// 2. Create transaction using vault.transaction()
const { tx, hashTxId } = await vault.transaction({
  assets: [{
    assetId: '0x...',
    amount: '0.001',  // Decimal string format
    to: '0xRecipient...',
  }],
});

// 3. Save pending transaction
savePendingTransaction({
  hashTxId,
  transaction: input,
  signatures: [],
  requiredSignatures: config.SIGNATURES_COUNT,
});
```

### The Hash to Sign

The `hashTxId` returned by `vault.transaction()` is the message that signers need to sign. This hash represents the transaction and ensures that:

- The transaction cannot be modified after signing
- Each signer commits to the exact same transaction
- The predicate can verify the signatures

## Step 2: Sign Transaction

When you run `sign`, the CLI:

1. **Loads the pending transaction**
2. **Creates a Fuel wallet** from the private key
3. **Signs the `hashTxId`** using `wallet.signMessage()`
4. **Checks the threshold** and either saves or proceeds to send

### Code Flow

```typescript
// 1. Load pending transaction
const pending = loadPendingTransaction();

// 2. Create wallet and sign
const wallet = Wallet.fromPrivateKey(privateKey);
const signerAddress = wallet.address.toB256();
const signature = await wallet.signMessage(pending.hashTxId);

// 3. Check threshold
if (currentSignatures >= requiredSignatures) {
  // Ready to send
} else {
  // Save signature for later
  pending.signatures.push(JSON.stringify({ signer, signature }));
  savePendingTransaction(pending);
}
```

### Signature Format

The signature is a standard Fuel signature (ECDSA secp256k1):
- 64 bytes encoded as hex string
- Starts with `0x`
- Example: `0xa239fee1df09542f...`

## Step 3: Encode Witnesses

Before sending, signatures must be encoded for the predicate:

```typescript
// Encode each signature using vault.encodeSignature()
const witnesses: string[] = [];
for (const sig of signatures) {
  const encodedSignature = vault.encodeSignature(sig.signer, sig.signature);
  witnesses.push(encodedSignature);
}

// Set witnesses on the transaction
tx.witnesses = witnesses;
```

### Why Encoding is Needed

The BakoSafe predicate expects witnesses in a specific format that includes:
- The signer's address
- The signature
- Proper encoding for predicate verification

## Step 4: Send Transaction

When sending, the CLI:

1. **Recreates the transaction** with the same parameters
2. **Encodes all signatures** as witnesses
3. **Sends via `vault.send()`**
4. **Waits for the result**
5. **Cleans up** the pending transaction

### Code Flow

```typescript
// 1. Recreate transaction (must use same parameters)
const { tx } = await vault.transaction({
  assets: [{
    assetId,
    amount: pending.transaction.amount,
    to: pending.transaction.to,
  }],
});

// 2. Encode and set witnesses
tx.witnesses = signatures.map(sig =>
  vault.encodeSignature(sig.signer, sig.signature)
);

// 3. Send
const response = await vault.send(tx);
const result = await response.waitForResult();

// 4. Cleanup
deletePendingTransaction();
```

## Important: Amount Format

The BakoSafe SDK expects amounts as **decimal strings**, not base units:

| Format | Meaning | Correct? |
|--------|---------|----------|
| `'0.001'` | 0.001 ETH | ✅ Yes |
| `'1'` | 1 ETH | ✅ Yes |
| `'1000'` | 1000 ETH (!) | ⚠️ Probably not intended |
| `1000` | Invalid | ❌ No |

## Multi-Signature Flow

For vaults requiring multiple signatures:

```
Signer 1                    Signer 2                    Network
────────                    ────────                    ───────
create-tx
    │
    ▼
sign (pk1)
    │
    ▼
.pending-tx.json
(1 signature)
    │
    ├───── share file ─────▶ sign (pk2)
    │                            │
    │                            ▼
    │                       .pending-tx.json
    │                       (2 signatures)
    │                            │
    │                            ▼
    │                       Threshold reached
    │                            │
    │                            ▼
    │                       vault.send(tx) ──────────▶ TX Submitted
    │                            │
    │                            ▼
    │                       Delete .pending-tx.json
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `PredicateVerificationFailed` | Invalid signature or witness encoding | Ensure signing the correct hash |
| `InsufficientBalance` | Vault doesn't have enough funds | Check balances with `bako-vault balances` |
| `OutOfGas` | Transaction ran out of gas | Usually indicates signature issues |

### Debugging Tips

1. **Verify signer address**: Ensure the private key corresponds to a valid signer in the vault
2. **Check the hash**: The `hashTxId` must be signed directly, not modified
3. **Amount format**: Use decimal strings like `'0.001'`, not base units

## Security Model

### What the Predicate Verifies

1. **Correct number of signatures** (>= `SIGNATURES_COUNT`)
2. **Valid signers** (addresses in `SIGNERS` array)
3. **Valid signatures** (cryptographically correct for the transaction)

### Trust Assumptions

- Private keys never leave the signer's machine
- The pending transaction file can be shared (contains no secrets)
- Signatures are only valid for the specific transaction
