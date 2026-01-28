# Commands Reference

Complete reference for all Bako Vault CLI commands.

## Global Options

```bash
bako-vault [options] [command]

Options:
  -V, --version  Output the version number
  -h, --help     Display help for command
```

## list-wallets

List all configured wallets.

### Usage

```bash
bako-vault list-wallets
bako-vault ls  # alias
```

### Output

```
Configured Wallets:

────────────────────────────────────────────────────────────
  my-vault
    Signers: 2
    Required: 2 signature(s)
    Version: 0x967aaa71...

  personal
    Signers: 1
    Required: 1 signature(s)
    Version: 0x967aaa71...
────────────────────────────────────────────────────────────
Total: 2 wallet(s)
```

---

## list-networks

List all configured networks.

### Usage

```bash
bako-vault list-networks
bako-vault networks  # alias
```

### Output

```
Configured Networks:

────────────────────────────────────────────────────────────
  testnet
    URL: https://testnet.fuel.network/v1/graphql
    Explorer: https://app-testnet.fuel.network
    ETH: 0xf8f8b628...

  mainnet
    URL: https://mainnet.fuel.network/v1/graphql
    Explorer: https://app.fuel.network
    ETH: 0xf8f8b628...
────────────────────────────────────────────────────────────
Total: 2 network(s)
```

---

## wallet-info

Show detailed wallet information.

### Usage

```bash
bako-vault wallet-info <wallet> -n <network>
bako-vault info <wallet> -n <network>  # alias
```

### Options

| Option | Required | Description |
|--------|----------|-------------|
| `-n, --network <name>` | Yes | Network name |

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `wallet` | Yes | Wallet name |

### Example

```bash
bako-vault info my-vault -n testnet
```

### Output

```
Wallet: my-vault

──────────────────────────────────────────────────────────────────────
  Address:
    0x06892108eaf0ff861bad440ecc1b609f03c07ac6d0128eb15818da9105419ac3

  Network:
    testnet (https://testnet.fuel.network/v1/graphql)

  Predicate Version:
    0x967aaa71b3db34acd8104ed1d7ff3900e67cff3d153a0ffa86d85957f579aa6a

  Signers (2):
    1. 0xed2b955f8bee5d1a0c01fcbdb6b20cd5420fdac05af1c13934af1a5fa0c632b9
    2. 0x44d4e649de059432c9a658839a2ac12706bf0b66b07f300d83ceb0ca02c32ace

  Signatures Required:
    2 of 2

  Balances:
    ETH: 1000000
──────────────────────────────────────────────────────────────────────
```

---

## create-tx

Create a new transaction.

### Usage

```bash
bako-vault create-tx [options]
bako-vault create [options]  # alias
```

### Options

| Option | Required | Description |
|--------|----------|-------------|
| `-w, --wallet <name>` | Yes | Wallet name |
| `-n, --network <name>` | Yes | Network name |
| `-t, --to <address>` | Yes* | Recipient address |
| `-a, --amount <value>` | Yes* | Amount (decimal, e.g., 0.001) |
| `--asset <assetId>` | No | Asset ID (default: ETH) |
| `-f, --file <path>` | No | JSON file with transaction data |

*Required unless using `-f`

### Amount Format

The amount is specified as a **decimal string**:
- `0.001` = 0.001 ETH
- `1` = 1 ETH
- `0.000001` = 0.000001 ETH

### Examples

```bash
# Using command line options
bako-vault create-tx -w my-vault -n testnet -t 0xRecipient... -a 0.001

# Using a JSON file
bako-vault create-tx -w my-vault -n testnet -f transaction.json

# With a specific asset
bako-vault create-tx -w my-vault -n testnet -t 0xRecipient... -a 100 --asset 0xUsdcAssetId...
```

### Transaction File Format

`transaction.json`:
```json
{
  "to": "0x44d4e649de059432c9a658839a2ac12706bf0b66b07f300d83ceb0ca02c32ace",
  "amount": "0.001",
  "assetId": "0x..."
}
```

### Output

```
Transaction created!

──────────────────────────────────────────────────────────────────────

  Vault Address:
    0x06892108eaf0ff861bad440ecc1b609f03c07ac6d0128eb15818da9105419ac3

  Transaction Details:
    To: 0x44d4e649de059432c9a658839a2ac12706bf0b66b07f300d83ceb0ca02c32ace
    Amount: 0.001
    Asset: ETH (default)

  Signatures Required:
    2

  Hash to Sign:
    9dc380dcea8810eebe2685603c069fa79bc32b478577328c9271c46c06b152d1

──────────────────────────────────────────────────────────────────────

  Next Step:
    Run: bako-vault sign
```

---

## sign

Sign the pending transaction using a private key.

### Usage

```bash
bako-vault sign [options]
```

### Options

| Option | Required | Description |
|--------|----------|-------------|
| `-p, --pk <privateKey>` | No | Private key (prompted if not provided) |

### Example

```bash
# With private key as argument
bako-vault sign -p 0xYourPrivateKey...

# Interactive mode (secure)
bako-vault sign
# Enter your private key (0x...): ********
```

### Behavior

1. Signs the pending transaction's `hashTxId`
2. If threshold is reached, prompts to send
3. If more signatures needed, saves the signature

### Output (Threshold Reached)

```
Pending Transaction
──────────────────────────────────────────────────────────────────────

  Details:
    Wallet: my-vault
    Network: testnet
    To: 0x44d4e649de059432c9a658839a2ac12706bf0b66b07f300d83ceb0ca02c32ace
    Amount: 0.001

  Hash to Sign:
    9dc380dcea8810eebe2685603c069fa79bc32b478577328c9271c46c06b152d1

  Signature created!

──────────────────────────────────────────────────────────────────────

  Signer Address:
    0xed2b955f8bee5d1a0c01fcbdb6b20cd5420fdac05af1c13934af1a5fa0c632b9

  Signature:
    0xa239fee1df09542fde59ee6a6ce66f200d448663f77c1d3aa4f16062b05c5a36...

  Signatures:
    1 of 1 required

  Threshold reached! Ready to send.
? Send transaction now? (Y/n)
```

---

## send-tx

Send the pending transaction with provided signatures.

### Usage

```bash
bako-vault send-tx [options]
bako-vault send [options]  # alias
```

### Options

| Option | Required | Description |
|--------|----------|-------------|
| `-n, --network <name>` | No | Network name (uses pending tx network) |
| `-s, --signer <address>` | No | Signer address |
| `-S, --signature <sig>` | No | Signature |

### Examples

```bash
# Interactive mode
bako-vault send-tx

# With signature via CLI
bako-vault send-tx -s 0xSignerAddress... -S 0xSignature...
```

### Output

```
Transaction submitted successfully!

──────────────────────────────────────────────────────────────────────

  Transaction ID:
    0x9dc380dcea8810eebe2685603c069fa79bc32b478577328c9271c46c06b152d1

  Status:
    success

  View: https://app-testnet.fuel.network/tx/0x9dc380dcea8810eebe...

──────────────────────────────────────────────────────────────────────
```

---

## balances

List balances of all wallets across all networks.

### Usage

```bash
bako-vault balances
bako-vault bal  # alias
```

### Output

```
Wallet Balances

──────────────────────────────────────────────────────────────────────

  my-vault

    mainnet:
      No balances

    testnet:
      ETH: 2799594

  personal

    mainnet:
      No balances

    testnet:
      ETH: 1000000
      USDC: 500000

──────────────────────────────────────────────────────────────────────
```

---

## Common Workflows

### Single Signature Transaction

```bash
# 1. Create
bako-vault create-tx -w personal -n testnet -t 0xRecipient -a 0.001

# 2. Sign and send
bako-vault sign -p 0xPrivateKey
# Select 'Y' when prompted to send
```

### Multi-Signature Transaction (2 of 2)

```bash
# 1. Create (on any machine)
bako-vault create-tx -w team-vault -n testnet -t 0xRecipient -a 1

# 2. First signer signs
bako-vault sign -p 0xFirstPrivateKey
# Signature saved, need 1 more

# 3. Second signer signs
bako-vault sign -p 0xSecondPrivateKey
# Threshold reached, prompted to send
```

### Check Wallet Before Sending

```bash
# Check all balances
bako-vault balances

# Check specific wallet
bako-vault info my-vault -n testnet
```
