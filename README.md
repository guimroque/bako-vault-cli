# Bako Vault CLI

CLI para interagir com Bako Vault na rede Fuel.

## Instalação

```bash
pnpm install
```

## Uso

### Modo Interativo

```bash
pnpm start
```

### Com Argumentos

```bash
# Produção
pnpm start connect --token <API_TOKEN>

# Staging
pnpm start connect --token <API_TOKEN> --server-api https://stg-api.bako.global

# Local
pnpm start connect --token <API_TOKEN> --server-api http://localhost:3333 --network http://localhost:4000/v1/graphql
```

### Opções

| Opção | Descrição | Default |
|-------|-----------|---------|
| `-t, --token` | Bako API Token | - |
| `-s, --server-api` | URL da API do Bako | `https://api.bako.global` |
| `-n, --network` | URL da rede Fuel | `https://mainnet.fuel.network/v1/graphql` |
| `-i, --interactive` | Modo interativo | `false` |

## Ambientes

### API
- **Production:** `https://api.bako.global`
- **Staging:** `https://stg-api.bako.global`
- **Local:** `http://localhost:3333`

### Network
- **Mainnet:** `https://mainnet.fuel.network/v1/graphql`
- **Testnet:** `https://testnet.fuel.network/v1/graphql`
- **Local:** `http://localhost:4000/v1/graphql`

## Dependências

- [bakosafe](https://www.npmjs.com/package/bakosafe) - SDK do Bako Safe
- [fuels](https://www.npmjs.com/package/fuels) - SDK da Fuel Network
- [commander](https://www.npmjs.com/package/commander) - CLI framework
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts) - Prompts interativos
