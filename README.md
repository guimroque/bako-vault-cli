# Bako Vault CLI

CLI tool to interact with Bako Vault on the Fuel Network.

## Installation

```bash
pnpm install
```

## Usage

### Interactive Mode

```bash
pnpm start
```

### With Arguments

```bash
# Production
pnpm start connect --token <API_TOKEN>

# Staging
pnpm start connect --token <API_TOKEN> --server-api https://stg-api.bako.global

# Local
pnpm start connect --token <API_TOKEN> --server-api http://localhost:3333 --network http://localhost:4000/v1/graphql
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --token` | Bako API Token | - |
| `-s, --server-api` | Bako API URL | `https://api.bako.global` |
| `-n, --network` | Fuel Network URL | `https://mainnet.fuel.network/v1/graphql` |
| `-i, --interactive` | Interactive mode | `false` |

## Environments

### API
- **Production:** `https://api.bako.global`
- **Staging:** `https://stg-api.bako.global`
- **Local:** `http://localhost:3333`

### Network
- **Mainnet:** `https://mainnet.fuel.network/v1/graphql`
- **Testnet:** `https://testnet.fuel.network/v1/graphql`
- **Local:** `http://localhost:4000/v1/graphql`

## Dependencies

- [bakosafe](https://www.npmjs.com/package/bakosafe) - Bako Safe SDK
- [fuels](https://www.npmjs.com/package/fuels) - Fuel Network SDK
- [commander](https://www.npmjs.com/package/commander) - CLI framework
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts) - Interactive prompts
