import { password, select } from '@inquirer/prompts';
import { BakoProvider, Vault } from 'bakosafe';
import { program } from 'commander';

// URLs das APIs disponíveis
const API_URLS = {
  production: 'https://api.bako.global',
  staging: 'https://stg-api.bako.global',
  local: 'http://localhost:3333',
} as const;

const NETWORK_URLS = {
  mainnet: 'https://mainnet.fuel.network/v1/graphql',
  testnet: 'https://testnet.fuel.network/v1/graphql',
  local: 'http://localhost:4000/v1/graphql',
} as const;

type ApiEnvironment = keyof typeof API_URLS;
type NetworkEnvironment = keyof typeof NETWORK_URLS;

interface CliOptions {
  api?: string;
  network?: string;
  token?: string;
  serverApi?: string;
  interactive?: boolean;
}

async function runInteractive() {
  console.log('\n🔐 Bako Vault CLI\n');

  // Seleciona o ambiente da API
  const apiEnv = await select<ApiEnvironment>({
    message: 'Select Bako API environment:',
    choices: [
      { name: 'Production (api-safe.bako.global)', value: 'production' },
      { name: 'Staging (stg-api.bako.global)', value: 'staging' },
      { name: 'Local (localhost:3333)', value: 'local' },
    ],
  });

  // Seleciona a rede Fuel
  const networkEnv = await select<NetworkEnvironment>({
    message: 'Select Fuel network:',
    choices: [
      { name: 'Mainnet', value: 'mainnet' },
      { name: 'Testnet', value: 'testnet' },
      { name: 'Local', value: 'local' },
    ],
  });

  // Solicita o API Token
  const apiToken = await password({
    message: 'Enter your Bako API Token:',
  });

  if (!apiToken) {
    console.error('❌ API Token is required');
    process.exit(1);
  }

  await connectToVault({
    serverApi: API_URLS[apiEnv],
    network: NETWORK_URLS[networkEnv],
    token: apiToken,
  });
}

async function connectToVault(options: {
  serverApi: string;
  network: string;
  token: string;
}) {
  const { serverApi, network, token } = options;

  console.log('\n--- Configuration ---');
  console.log('📡 Server API:', serverApi);
  console.log('🌐 Network URL:', network);
  console.log('🔑 API Token:', token.substring(0, 10) + '...');
  console.log('---------------------\n');

  try {
    // Cria o BakoProvider com serverApi (já conecta à rede Fuel internamente)
    console.log('⏳ Creating BakoProvider...');
    const vaultProvider = await BakoProvider.create(network, {
      apiToken: token,
      serverApi,
    });
    console.log('✅ BakoProvider created');

    // Cria o Vault
    console.log('⏳ Loading Vault...');
    const vault = new Vault(vaultProvider);
    console.log('✅ Vault loaded');

    console.log('\n--- Vault Info ---');
    console.log('📍 Vault Address:', vault.address.toB256());
    console.log('📦 Predicate Version:', vault.version);
    console.log('------------------\n');

    // Obtém os balances
    console.log('⏳ Fetching balances...');
    const balances = await vault.getBalances();
    console.log('💰 Balances:', JSON.stringify(balances, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

    return { vault, provider: vaultProvider };
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// CLI com commander
program
  .name('bako-vault-cli')
  .description('CLI para interagir com Bako Vault')
  .version('1.0.0');

program
  .command('connect')
  .description('Connect to a Bako Vault')
  .option('-t, --token <token>', 'Bako API Token')
  .option('-s, --server-api <url>', 'Bako Server API URL', API_URLS.production)
  .option('-n, --network <url>', 'Fuel Network URL', NETWORK_URLS.mainnet)
  .option('-i, --interactive', 'Run in interactive mode')
  .action(async (options: CliOptions) => {
    if (options.interactive || !options.token) {
      await runInteractive();
    } else {
      await connectToVault({
        serverApi: options.serverApi || API_URLS.production,
        network: options.network || NETWORK_URLS.mainnet,
        token: options.token,
      });
    }
  });

program
  .command('interactive')
  .description('Run in interactive mode')
  .action(runInteractive);

// Default: interactive mode
if (process.argv.length <= 2) {
  runInteractive();
} else {
  program.parse();
}
