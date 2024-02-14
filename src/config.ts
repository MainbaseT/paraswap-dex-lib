import { Config, Address, Token } from './types';

import { Network, PORT_TEST_SERVER, ETHER_ADDRESS } from './constants';
import { isETHAddress } from './utils';
import { RFQConfig } from './dex/generic-rfq/types';

// Hardcoded and environment values from which actual config is derived
type BaseConfig = {
  network: number;
  networkName: string;
  isTestnet: boolean;
  mainnetNetwork?: number;
  nativeTokenName?: string;
  nativeTokenSymbol: string;
  wrappedNativeTokenName?: string;
  wrappedNativeTokenSymbol?: string;
  wrappedNativeTokenAddress: Address;
  hasEIP1559: boolean;
  augustusAddress: Address;
  augustusV6Address?: Address;
  augustusRFQAddress: Address;
  tokenTransferProxyAddress: Address;
  multicallV2Address: Address;
  privateHttpProvider?: string;
  adapterAddresses: { [name: string]: Address };
  executorsAddresses?: { [name: string]: Address };
  uniswapV2ExchangeRouterAddress: Address;
  uniswapV3EventLoggingSampleRate?: number;
  rfqConfigs: Record<string, RFQConfig>;
  rpcPollingMaxAllowedStateDelayInBlocks: number;
  rpcPollingBlocksBackToTriggerUpdate: number;
  hashFlowAuthToken?: string;
  hashFlowDisabledMMs: string[];
  swaapV2AuthToken?: string;
  dexalotAuthToken?: string;
  smardexSubgraphAuthToken?: string;
  forceRpcFallbackDexs: string[];
};

const baseConfigs: { [network: number]: BaseConfig } = {
  [Network.MAINNET]: {
    network: Network.MAINNET,
    networkName: 'Ethereum Mainnet',
    isTestnet: false,
    nativeTokenName: 'Ether',
    nativeTokenSymbol: 'ETH',
    wrappedNativeTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    hasEIP1559: true,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusV6Address: '0x6011064c7FEd76f8214eA40ac18a8aF6075ba1Cd',
    augustusRFQAddress: '0xe92b586627ccA7a83dC919cc7127196d70f55a06',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    privateHttpProvider: process.env.HTTP_PROVIDER_1,
    executorsAddresses: {
      Executor01: '0x0C89964b85feA6825E1d0Bd8Bbd99f12591182ea',
      Executor02: '0xFf8CBFD8FF204a80586AE856a93f174F121AE47A',
    },
    adapterAddresses: {
      Adapter01: '0x9bE264469eF954c139Da4A45Cf76CbCC5e3A6A73',
      Adapter02: '0xFC2Ba6E830a04C25e207B8214b26d8C713F6881F',
      Adapter03: '0xBAEeb4540f59d30E567a5B563CC0c4587eDd9366',
      Adapter04: '0x369A2FDb910d432f0a07381a5E3d27572c876713',
      BuyAdapter: '0x84bEF12C9931cE12662cc9F2366b6a5029E4BD29',
      BuyAdapter02: '0xe53d24CD81cC81bbf271AD7B02D0d67f851D727c',
    },
    uniswapV2ExchangeRouterAddress:
      '0xF9234CB08edb93c0d4a4d4c70cC3FfD070e78e07',
    rpcPollingMaxAllowedStateDelayInBlocks: 0,
    rpcPollingBlocksBackToTriggerUpdate: 0,
    swaapV2AuthToken: process.env.API_KEY_SWAAP_V2_AUTH_TOKEN || '',
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_1`]?.split(',') || [],
    uniswapV3EventLoggingSampleRate: 0,
    rfqConfigs: {
      DummyParaSwapPool: {
        maker: process.env.TEST_ADDRESS!,
        tokensConfig: {
          reqParams: {
            url: `http://localhost:${PORT_TEST_SERVER}/tokens`,
            method: 'GET',
          },
          secret: {
            domain: 'paraswap-test',
            accessKey: 'access',
            secretKey: 'secret',
          },
          intervalMs: 1000 * 60 * 60 * 10, // every 10 minutes
          dataTTLS: 1000 * 60 * 60 * 11, // ttl 11 minutes
        },
        pairsConfig: {
          reqParams: {
            url: `http://localhost:${PORT_TEST_SERVER}/pairs`,
            method: 'GET',
          },
          secret: {
            domain: 'paraswap-test',
            accessKey: 'access',
            secretKey: 'secret',
          },
          intervalMs: 1000 * 60 * 60 * 10, // every 10 minutes
          dataTTLS: 1000 * 60 * 60 * 11, // ttl 11 minutes
        },
        rateConfig: {
          reqParams: {
            url: `http://localhost:${PORT_TEST_SERVER}/prices`,
            method: 'GET',
          },
          secret: {
            domain: 'paraswap-test',
            accessKey: 'access',
            secretKey: 'secret',
          },
          intervalMs: 1000 * 60 * 60 * 1, // every 1 minute
          dataTTLS: 1000 * 60 * 60 * 1, // ttl 1 minute
        },
        firmRateConfig: {
          url: `http://localhost:${PORT_TEST_SERVER}/firm`,
          method: 'POST',
          secret: {
            domain: 'paraswap-test',
            accessKey: 'access',
            secretKey: 'secret',
          },
        },
      },
    },
    forceRpcFallbackDexs: [],
  },
  [Network.ROPSTEN]: {
    network: Network.ROPSTEN,
    networkName: 'Ethereum Ropsten Testnet',
    isTestnet: true,
    mainnetNetwork: Network.MAINNET,
    nativeTokenName: 'Ether',
    nativeTokenSymbol: 'ETH',
    wrappedNativeTokenAddress: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    hasEIP1559: true,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusRFQAddress: '0x34268C38fcbC798814b058656bC0156C7511c0E4',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    privateHttpProvider: process.env.HTTP_PROVIDER_3,
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_3`]?.split(',') || [],

    adapterAddresses: {
      RopstenAdapter01: '0x59b7F6258e78C3E5234bb651656EDd0e08868cd5',
      RopstenBuyAdapter: '0x63e908A4C793a33e40254362ED1A5997a234D85C',
    },
    uniswapV2ExchangeRouterAddress:
      '0x53e693c6C7FFC4446c53B205Cf513105Bf140D7b',
    rfqConfigs: {},
    rpcPollingMaxAllowedStateDelayInBlocks: 5,
    rpcPollingBlocksBackToTriggerUpdate: 3,
    forceRpcFallbackDexs: [],
  },
  [Network.BSC]: {
    network: Network.BSC,
    networkName: 'Binance Smart Chain Mainnet',
    isTestnet: false,
    nativeTokenSymbol: 'BNB',
    wrappedNativeTokenAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    hasEIP1559: false,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusRFQAddress: '0x8DcDfe88EF0351f27437284D0710cD65b20288bb',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D',
    privateHttpProvider: process.env.HTTP_PROVIDER_56,
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_56`]?.split(',') || [],
    adapterAddresses: {
      BscAdapter01: '0xA31d9C571DF00e0F428B0bD24c34D103E8112222',
      BscAdapter02: '0x9A92D2649C38415860FA59ba8B9a9960cd2839Db',
      BscBuyAdapter: '0xd32C191e0febaa6Cc93A29Cb676474c72486E00b',
    },
    rpcPollingMaxAllowedStateDelayInBlocks: 1,
    rpcPollingBlocksBackToTriggerUpdate: 1,
    uniswapV2ExchangeRouterAddress:
      '0x53e693c6C7FFC4446c53B205Cf513105Bf140D7b',
    rfqConfigs: {},
    forceRpcFallbackDexs: [],
  },
  [Network.POLYGON]: {
    network: Network.POLYGON,
    networkName: 'Polygon Mainnet',
    isTestnet: false,
    nativeTokenName: 'Matic',
    nativeTokenSymbol: 'MATIC',
    wrappedNativeTokenAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    hasEIP1559: true,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusV6Address: '0x80492bC2A01172A6796af80576D185018BF34d5B',
    augustusRFQAddress: '0xF3CD476C3C4D3Ac5cA2724767f269070CA09A043',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0x275617327c958bD06b5D6b871E7f491D76113dd8',
    privateHttpProvider: process.env.HTTP_PROVIDER_137,
    executorsAddresses: {
      Executor01: '0x00aeCC0E97060628f88282805FCfb80cc8877740',
      Executor02: '0xa11ADAdFAd58Aad4827B973b24CF595c201dfc22',
    },
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_137`]?.split(',') || [],
    adapterAddresses: {
      PolygonAdapter01: '0xE44769f42E1e9592f86B82f206407a8f7C84b4ed',
      PolygonAdapter02: '0x84bEF12C9931cE12662cc9F2366b6a5029E4BD29',
      PolygonBuyAdapter: '0xBAEeb4540f59d30E567a5B563CC0c4587eDd9366',
    },
    uniswapV2ExchangeRouterAddress:
      '0xf3938337F7294fEf84e9B2c6D548A93F956Cc281',
    uniswapV3EventLoggingSampleRate: 0,
    rfqConfigs: {},
    rpcPollingMaxAllowedStateDelayInBlocks: 2,
    rpcPollingBlocksBackToTriggerUpdate: 1,
    swaapV2AuthToken: process.env.API_KEY_SWAAP_V2_AUTH_TOKEN || '',
    forceRpcFallbackDexs: [],
  },
  [Network.AVALANCHE]: {
    network: Network.AVALANCHE,
    networkName: 'Avalanche Mainnet C-Chain',
    isTestnet: false,
    nativeTokenName: 'Avax',
    nativeTokenSymbol: 'AVAX',
    wrappedNativeTokenAddress: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    hasEIP1559: true,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusV6Address: '0xe8a4Ec22b7BaC07a7e2b5A1eD93d2944c397e71b',
    augustusRFQAddress: '0x34302c4267d0dA0A8c65510282Cc22E9e39df51f',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0xd7Fc8aD069f95B6e2835f4DEff03eF84241cF0E1',
    privateHttpProvider: process.env.HTTP_PROVIDER_43114,
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_43114`]?.split(',') || [],
    dexalotAuthToken: process.env.API_KEY_DEXALOT_AUTH_TOKEN || '',
    executorsAddresses: {
      Executor01: '0x958F695C0755CBD505AB6EBC9Ece9eC1370a8617',
      Executor02: '0xBda365702750af180abEd5f53318Ae61c002e674',
    },
    adapterAddresses: {
      AvalancheAdapter01: '0x745Ec73855CeC7249E5fF4c9DD81cc65b4D297a9',
      AvalancheAdapter02: '0xA10c9a84E72d9DfF424Fe2284B6460784bed407E',
      AvalancheBuyAdapter: '0x654dE10890f8B2C5bF54E50Af169a7E93165C416',
    },
    uniswapV2ExchangeRouterAddress:
      '0x53e693c6C7FFC4446c53B205Cf513105Bf140D7b',
    rfqConfigs: {},
    rpcPollingMaxAllowedStateDelayInBlocks: 2,
    rpcPollingBlocksBackToTriggerUpdate: 1,
    forceRpcFallbackDexs: [],
  },
  [Network.FANTOM]: {
    network: Network.FANTOM,
    networkName: 'Fantom Opera Mainnet',
    isTestnet: false,
    nativeTokenName: 'Fantom',
    nativeTokenSymbol: 'FTM',
    wrappedNativeTokenAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    hasEIP1559: false,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusRFQAddress: '0x2DF17455B96Dde3618FD6B1C3a9AA06D6aB89347',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0xdC6E2b14260F972ad4e5a31c68294Fba7E720701',
    privateHttpProvider: process.env.HTTP_PROVIDER_250,
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_250`]?.split(',') || [],

    adapterAddresses: {
      FantomAdapter01: '0x654dE10890f8B2C5bF54E50Af169a7E93165C416',
      FantomBuyAdapter: '0xb2634B3CBc1E401AB3C2743DB44d459C5c9aA662',
    },
    uniswapV2ExchangeRouterAddress:
      '0xAB86e2bC9ec5485a9b60E684BA6d49bf4686ACC2',
    rfqConfigs: {},
    rpcPollingMaxAllowedStateDelayInBlocks: 2,
    rpcPollingBlocksBackToTriggerUpdate: 1,
    forceRpcFallbackDexs: [],
  },
  [Network.ARBITRUM]: {
    network: Network.ARBITRUM,
    networkName: 'Arbitrum One',
    isTestnet: false,
    nativeTokenName: 'Ether',
    nativeTokenSymbol: 'ETH',
    wrappedNativeTokenAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    hasEIP1559: false,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusV6Address: '0x205ca600811Dab8c01d807851bbB32a1fEf454fF',
    augustusRFQAddress: '0x0927FD43a7a87E3E8b81Df2c44B03C4756849F6D',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0x7eCfBaa8742fDf5756DAC92fbc8b90a19b8815bF',
    privateHttpProvider: process.env.HTTP_PROVIDER_42161,
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    swaapV2AuthToken: process.env.API_KEY_SWAAP_V2_AUTH_TOKEN || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_42161`]?.split(',') || [],
    executorsAddresses: {
      Executor01: '0x1F08e050B296c0FfA9161420fd1277a17588f324',
      Executor02: '0x4465c0F6E5802FD54c44398807A6036A9e649052',
    },
    adapterAddresses: {
      ArbitrumAdapter01: '0x369A2FDb910d432f0a07381a5E3d27572c876713',
      ArbitrumAdapter02: '0x58a5f0b73969800FAFf8556cD2187E3FCE71A6cb',
      ArbitrumBuyAdapter: '0x4483Ae378897eB9FbF7f15Df98Bf07233ffFEe8b',
    },
    uniswapV2ExchangeRouterAddress:
      '0xB41dD984730dAf82f5C41489E21ac79D5e3B61bC',
    uniswapV3EventLoggingSampleRate: 0,
    rfqConfigs: {},
    rpcPollingMaxAllowedStateDelayInBlocks: 4,
    rpcPollingBlocksBackToTriggerUpdate: 3,
    forceRpcFallbackDexs: [],
  },
  [Network.OPTIMISM]: {
    network: Network.OPTIMISM,
    networkName: 'Optimistic Ethereum',
    isTestnet: false,
    nativeTokenName: 'Ether',
    nativeTokenSymbol: 'ETH',
    wrappedNativeTokenAddress: '0x4200000000000000000000000000000000000006',
    hasEIP1559: false,
    augustusAddress: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
    augustusRFQAddress: '0x0927FD43a7a87E3E8b81Df2c44B03C4756849F6D',
    tokenTransferProxyAddress: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
    multicallV2Address: '0x2DC0E2aa608532Da689e89e237dF582B783E552C',
    privateHttpProvider: process.env.HTTP_PROVIDER_10,
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_10`]?.split(',') || [],
    adapterAddresses: {
      OptimismAdapter01: '0x5dcf544b0c9689fa67dcb713fd2656d217e25a59',
      OptimismBuyAdapter: '0xA10c9a84E72d9DfF424Fe2284B6460784bed407E',
    },
    uniswapV2ExchangeRouterAddress:
      '0xB41dD984730dAf82f5C41489E21ac79D5e3B61bC',
    uniswapV3EventLoggingSampleRate: 0,
    rfqConfigs: {},
    rpcPollingMaxAllowedStateDelayInBlocks: 5,
    rpcPollingBlocksBackToTriggerUpdate: 3,
    forceRpcFallbackDexs: [],
  },
  [Network.ZKEVM]: {
    network: Network.ZKEVM,
    networkName: 'Polygon zkEVM',
    isTestnet: false,
    nativeTokenName: 'Ether',
    nativeTokenSymbol: 'ETH',
    wrappedNativeTokenAddress: '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9',
    hasEIP1559: true,
    augustusAddress: '0xB83B554730d29cE4Cb55BB42206c3E2c03E4A40A',
    augustusRFQAddress: '0x7Ee1F7fa4C0b2eDB0Fdd5944c14A07167700486E',
    tokenTransferProxyAddress: '0xc8a21fcd5a100c3ecc037c97e2f9c53a8d3a02a1',
    multicallV2Address: '0x6cA478C852DfA8941FC819fDf248606eA04780B6',
    privateHttpProvider: process.env.HTTP_PROVIDER_1101,
    adapterAddresses: {
      PolygonZkEvmAdapter01: '0xd63B7691dD98fa89A2ea5e1604700489c585aa7B',
      PolygonZkEvmBuyAdapter: '0xe2137168CdA486a2555E16c597905854C84F9127',
    },

    rpcPollingMaxAllowedStateDelayInBlocks: 0,
    rpcPollingBlocksBackToTriggerUpdate: 0,
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs:
      process.env[`HASHFLOW_DISABLED_MMS_10`]?.split(',') || [],
    uniswapV3EventLoggingSampleRate: 0,
    rfqConfigs: {},
    forceRpcFallbackDexs: [],
    // FIXME: Not set properly
    uniswapV2ExchangeRouterAddress: '',
  },
  [Network.BASE]: {
    network: Network.BASE,
    networkName: 'Base',
    isTestnet: false,
    nativeTokenName: 'Ether',
    nativeTokenSymbol: 'ETH',
    wrappedNativeTokenAddress: '0x4200000000000000000000000000000000000006',
    hasEIP1559: false,
    augustusAddress: '0x59C7C832e96D2568bea6db468C1aAdcbbDa08A52',
    augustusRFQAddress: '0xa003dFBA51C9e1e56C67ae445b852bdEd7aC5EEd',
    tokenTransferProxyAddress: '0x93aAAe79a53759cD164340E4C8766E4Db5331cD7',
    multicallV2Address: '0xeDF6D2a16e8081F777eB623EeB4411466556aF3d',
    privateHttpProvider: process.env.HTTP_PROVIDER_8453,
    hashFlowAuthToken: process.env.API_KEY_HASHFLOW_AUTH_TOKEN || '',
    smardexSubgraphAuthToken: process.env.API_KEY_SMARDEX_SUBGRAPH || '',
    hashFlowDisabledMMs: [],
    adapterAddresses: {
      BaseAdapter01: '0xA10c9a84E72d9DfF424Fe2284B6460784bed407E',
      BaseBuyAdapter: '0xEECA9223063bD13e8ca77ed9e39a07f2BD1923E6',
    },
    uniswapV2ExchangeRouterAddress:
      '0x75d199EfB540e47D27D52c62Da3E7daC2B9e834F',
    uniswapV3EventLoggingSampleRate: 0,
    rfqConfigs: {},
    rpcPollingMaxAllowedStateDelayInBlocks: 5,
    rpcPollingBlocksBackToTriggerUpdate: 3,
    forceRpcFallbackDexs: [],
  },
};

// Should not be used, except by internal test code
export function generateConfig(network: number): Config {
  const baseConfig = baseConfigs[network];
  if (!baseConfig) {
    throw new Error(`No configuration found for network ${network}`);
  }
  const nativeTokenName =
    baseConfig.nativeTokenName || baseConfig.nativeTokenSymbol;
  if (!baseConfig.privateHttpProvider) {
    throw new Error(`Missing HTTP Provider for network ${network}`);
  }
  return {
    network: baseConfig.network,
    networkName: baseConfig.networkName,
    isTestnet: baseConfig.isTestnet,
    mainnetNetwork: baseConfig.mainnetNetwork,
    nativeTokenName,
    nativeTokenSymbol: baseConfig.nativeTokenSymbol,
    wrappedNativeTokenName:
      baseConfig.wrappedNativeTokenName || `Wrapped ${nativeTokenName}`,
    wrappedNativeTokenSymbol:
      baseConfig.wrappedNativeTokenSymbol || `W${baseConfig.nativeTokenSymbol}`,
    wrappedNativeTokenAddress: baseConfig.wrappedNativeTokenAddress,
    hasEIP1559: baseConfig.hasEIP1559,
    augustusAddress: baseConfig.augustusAddress,
    augustusV6Address: baseConfig.augustusV6Address,
    augustusRFQAddress: baseConfig.augustusRFQAddress,
    tokenTransferProxyAddress: baseConfig.tokenTransferProxyAddress,
    multicallV2Address: baseConfig.multicallV2Address,
    privateHttpProvider: baseConfig.privateHttpProvider,
    adapterAddresses: { ...baseConfig.adapterAddresses },
    executorsAddresses: { ...baseConfig.executorsAddresses },
    uniswapV2ExchangeRouterAddress: baseConfig.uniswapV2ExchangeRouterAddress,
    uniswapV3EventLoggingSampleRate: baseConfig.uniswapV3EventLoggingSampleRate,
    rfqConfigs: baseConfig.rfqConfigs,
    rpcPollingMaxAllowedStateDelayInBlocks:
      baseConfig.rpcPollingMaxAllowedStateDelayInBlocks,
    rpcPollingBlocksBackToTriggerUpdate:
      baseConfig.rpcPollingBlocksBackToTriggerUpdate,
    hashFlowAuthToken: baseConfig.hashFlowAuthToken,
    smardexSubgraphAuthToken: baseConfig.smardexSubgraphAuthToken,
    swaapV2AuthToken: baseConfig.swaapV2AuthToken,
    dexalotAuthToken: baseConfig.dexalotAuthToken,
    hashFlowDisabledMMs: baseConfig.hashFlowDisabledMMs,
    forceRpcFallbackDexs: baseConfig.forceRpcFallbackDexs,
  };
}

export class ConfigHelper {
  public masterBlockNumberCacheKey: string;

  constructor(
    public isSlave: boolean,
    public data: Config,
    masterCachePrefix: string,
  ) {
    this.masterBlockNumberCacheKey =
      `${masterCachePrefix}_${data.network}_bn`.toLowerCase();
  }

  wrapETH(token: Token): Token {
    return isETHAddress(token.address)
      ? { address: this.data.wrappedNativeTokenAddress, decimals: 18 }
      : token;
  }

  unwrapETH(token: Token): Token {
    return this.isWETH(token.address)
      ? { address: ETHER_ADDRESS, decimals: 18 }
      : token;
  }

  isWETH(tokenAddress: Address): boolean {
    return (
      tokenAddress.toLowerCase() ===
      this.data.wrappedNativeTokenAddress.toLowerCase()
    );
  }
}
