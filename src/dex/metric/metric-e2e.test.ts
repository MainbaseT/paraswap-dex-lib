import { testPriceRoute } from '../../../tests/utils-e2e';
import { OptimalRate } from '@paraswap/core';

function buildMetricRoute(params: {
  network: number;
  blockNumber: number;
  srcToken: string;
  srcDecimals: number;
  srcAmount: string;
  destToken: string;
  destDecimals: number;
  destAmount: string;
  pool: string;
  zeroForOne: boolean;
}): OptimalRate {
  return {
    blockNumber: params.blockNumber,
    network: params.network,
    srcToken: params.srcToken,
    srcDecimals: params.srcDecimals,
    srcAmount: params.srcAmount,
    destToken: params.destToken,
    destDecimals: params.destDecimals,
    destAmount: params.destAmount,
    bestRoute: [
      {
        percent: 100,
        swaps: [
          {
            srcToken: params.srcToken,
            srcDecimals: params.srcDecimals,
            destToken: params.destToken,
            destDecimals: params.destDecimals,
            swapExchanges: [
              {
                exchange: 'Metric',
                srcAmount: params.srcAmount,
                destAmount: params.destAmount,
                percent: 100,
                poolAddresses: [params.pool],
                data: {
                  pool: params.pool,
                  zeroForOne: params.zeroForOne,
                },
              },
            ],
          },
        ],
      },
    ],
    gasCostUSD: '0',
    gasCost: '150000',
    others: [],
    side: 'SELL',
    version: '6.2',
    contractAddress: '0x6a000f20005980200259b80c5102003040001068',
    tokenTransferProxy: '0x6a000f20005980200259b80c5102003040001068',
    contractMethod: 'swapExactAmountIn',
    partnerFee: 0,
    srcUSD: '0',
    destUSD: '0',
    partner: 'anon',
    maxImpactReached: false,
    hmac: '',
  } as unknown as OptimalRate;
}

// Mainnet tx 0x8a54b2ef0c985317f6e23bbe3e94009c38c4603bb69ca3e9780457e4bb145470
// 20,000 USDC → ~8.98 WETH (zeroForOne=false)
const mainnetRoute = buildMetricRoute({
  network: 1,
  blockNumber: 24843238,
  srcToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  srcDecimals: 6,
  srcAmount: '20000000000',
  destToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  destDecimals: 18,
  destAmount: '8982291463890689577',
  pool: '0x76d7c24374aef4a36ee9a3a8c49339ccc84d0743',
  zeroForOne: false,
});

// Base tx 0x89b1cd91b29f5bea9a8fa0fc2440407d4e9dedbf90184e0409bcd48cbfd6173c
// 6 WETH → ~0.186 cbBTC (zeroForOne=true)
const baseRoute = buildMetricRoute({
  network: 8453,
  blockNumber: 44614811,
  srcToken: '0x4200000000000000000000000000000000000006',
  srcDecimals: 18,
  srcAmount: '6000000000000000000',
  destToken: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
  destDecimals: 8,
  destAmount: '18582243',
  pool: '0x1300cf8460fb60c8112febe63ada84a8dd894d8a',
  zeroForOne: true,
});

describe('Metric E2E', () => {
  it('Mainnet: USDC → WETH', async () => {
    await testPriceRoute(mainnetRoute);
  });

  it('Base: WETH → cbBTC', async () => {
    await testPriceRoute(baseRoute);
  });
});
