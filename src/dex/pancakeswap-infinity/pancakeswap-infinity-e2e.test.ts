import dotenv from 'dotenv';
dotenv.config();

import {
  Network,
  SwapSide,
  ContractMethod,
  ETHER_ADDRESS,
} from '../../constants';
import { OptimalRate, TxObject } from '../../types';
import { ParaSwapVersion } from '@paraswap/core';
import { generateConfig } from '../../config';
import { Pool } from './types';
import { DummyDexHelper } from '../../dex-helper';
import { DexAdapterService } from '../../dex';
import { GenericSwapTransactionBuilder } from '../../generic-swap-transaction-builder';
import { TenderlySimulator, StateOverride } from '../../tenderly-simulation';
import { v4 as uuid } from 'uuid';
import { assert } from 'ts-essentials';

const network = Network.BSC;
const dexKey = 'pancakeswapinfinity';
const config = generateConfig(network);

type TestRoute = {
  name: string;
  srcToken: string;
  destToken: string;
  srcDecimals: number;
  destDecimals: number;
  srcAmount: string;
  destAmount: string;
  blockNumber: number;
  side: SwapSide;
  zeroForOne: boolean;
  pool: Pool;
};

const testRoutes: TestRoute[] = [
  {
    // tx: 0xe4ca3122f7755e2ce7ae88fb8dad519b95923876f2cc9de40a132ec1e0fa10eb
    name: 'currency1 -> USDT (zeroForOne=false)',
    srcToken: '0x7ec43cf65f1663f820427c62a5780b8f2e25593a',
    destToken: '0x55d398326f99059ff775485246999027b3197955',
    srcDecimals: 18,
    destDecimals: 18,
    srcAmount: '159095257075217814406',
    destAmount: '59215641039352306609',
    blockNumber: 91290814,
    side: SwapSide.SELL,
    zeroForOne: false,
    pool: {
      id: '0x0000000000000000000000000000000000000000000000000000000000000001',
      key: {
        currency0: '0x55d398326f99059ff775485246999027b3197955',
        currency1: '0x7ec43cf65f1663f820427c62a5780b8f2e25593a',
        hooks: '0x9a9b5331ce8d74b2b721291d57de696e878353fd',
        poolManager: '0xa0ffb9c1ce1fe56963b0321b32e7a0302114058b',
        fee: '67',
        tickSpacing: 10,
      },
    },
  },
  {
    // CAKE -> BNB via CLPool (no hooks)
    name: 'CAKE -> BNB (zeroForOne=false, no hooks)',
    srcToken: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    destToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    srcDecimals: 18,
    destDecimals: 18,
    srcAmount: '100000000000000000',
    destAmount: '245941671201085',
    blockNumber: 91350721,
    side: SwapSide.SELL,
    zeroForOne: false,
    pool: {
      id: '0x0000000000000000000000000000000000000000000000000000000000000002',
      key: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        hooks: '0x0000000000000000000000000000000000000000',
        poolManager: '0xa0ffb9c1ce1fe56963b0321b32e7a0302114058b',
        fee: '335',
        tickSpacing: 100,
      },
    },
  },
  {
    // CAKE -> WBNB via CLPool (no hooks)
    name: 'CAKE -> WBNB (zeroForOne=false, no hooks, native pool)',
    srcToken: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    destToken: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    srcDecimals: 18,
    destDecimals: 18,
    srcAmount: '100000000000000000',
    destAmount: '245941671201085',
    blockNumber: 91350721,
    side: SwapSide.SELL,
    zeroForOne: false,
    pool: {
      id: '0x0000000000000000000000000000000000000000000000000000000000000003',
      key: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        hooks: '0x0000000000000000000000000000000000000000',
        poolManager: '0xa0ffb9c1ce1fe56963b0321b32e7a0302114058b',
        fee: '335',
        tickSpacing: 100,
      },
    },
  },
  {
    // BNB -> CAKE via CLPool (no hooks, zeroForOne=true, tickSpacing=1)
    name: 'BNB -> CAKE (zeroForOne=true, no hooks, tickSpacing=1)',
    srcToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    destToken: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    srcDecimals: 18,
    destDecimals: 18,
    srcAmount: '100000000000000000',
    destAmount: '39284658135310027224',
    blockNumber: 91356408,
    side: SwapSide.SELL,
    zeroForOne: true,
    pool: {
      id: '0x0000000000000000000000000000000000000000000000000000000000000004',
      key: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        hooks: '0x0000000000000000000000000000000000000000',
        poolManager: '0xa0ffb9c1ce1fe56963b0321b32e7a0302114058b',
        fee: '335',
        tickSpacing: 1,
      },
    },
  },
  {
    // WBNB -> CAKE via CLPool (no hooks, zeroForOne=true, tickSpacing=1)
    name: 'WBNB -> CAKE (zeroForOne=true, no hooks, native pool, tickSpacing=1)',
    srcToken: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    destToken: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    srcDecimals: 18,
    destDecimals: 18,
    srcAmount: '100000000000000000',
    destAmount: '39284658135310027224',
    blockNumber: 91356408,
    side: SwapSide.SELL,
    zeroForOne: true,
    pool: {
      id: '0x0000000000000000000000000000000000000000000000000000000000000005',
      key: {
        currency0: '0x0000000000000000000000000000000000000000',
        currency1: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        hooks: '0x0000000000000000000000000000000000000000',
        poolManager: '0xa0ffb9c1ce1fe56963b0321b32e7a0302114058b',
        fee: '335',
        tickSpacing: 1,
      },
    },
  },
];

function buildPriceRoute(route: TestRoute): OptimalRate {
  return {
    blockNumber: route.blockNumber,
    network,
    srcToken: route.srcToken,
    srcDecimals: route.srcDecimals,
    srcAmount: route.srcAmount,
    srcUSD: '0',
    destToken: route.destToken,
    destDecimals: route.destDecimals,
    destAmount: route.destAmount,
    destUSD: '0',
    bestRoute: [
      {
        percent: 100,
        swaps: [
          {
            srcToken: route.srcToken,
            srcDecimals: route.srcDecimals,
            destToken: route.destToken,
            destDecimals: route.destDecimals,
            swapExchanges: [
              {
                exchange: dexKey,
                srcAmount: route.srcAmount,
                destAmount: route.destAmount,
                percent: 100,
                data: {
                  path: [
                    {
                      pool: route.pool,
                      tokenIn: route.srcToken,
                      tokenOut: route.destToken,
                      zeroForOne: route.zeroForOne,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
    gasCostUSD: '0',
    gasCost: '200000',
    side: route.side,
    contractMethod:
      route.side === SwapSide.SELL
        ? ContractMethod.swapExactAmountIn
        : ContractMethod.swapExactAmountOut,
    tokenTransferProxy: config.tokenTransferProxyAddress,
    contractAddress: config.augustusV6Address,
    partnerFee: 0,
    hmac: '',
    version: ParaSwapVersion.V6,
  };
}

describe('PancakeSwapInfinity E2E', () => {
  describe('BSC', () => {
    const dexHelper = new DummyDexHelper(network);
    const dexAdapterService = new DexAdapterService(dexHelper, network);
    const transactionBuilder = new GenericSwapTransactionBuilder(
      dexAdapterService,
    );

    testRoutes.forEach(route => {
      it(`should simulate ${route.side === SwapSide.SELL ? 'SELL' : 'BUY'}: ${
        route.name
      }`, async () => {
        const priceRoute = buildPriceRoute(route);
        const slippage = 100n;
        const minMaxAmount =
          route.side === SwapSide.SELL
            ? (BigInt(priceRoute.destAmount) * (10000n - slippage)) / 10000n
            : (BigInt(priceRoute.srcAmount) * (10000n + slippage)) / 10000n;
        const userAddress = TenderlySimulator.DEFAULT_OWNER;

        const swapParams = (await transactionBuilder.build({
          priceRoute,
          minMaxAmount: minMaxAmount.toString(),
          userAddress,
          partnerAddress: '0x0000000000000000000000000000000000000000',
          partnerFeePercent: '0',
          deadline: (Math.floor(Date.now() / 1000) + 600).toString(),
          uuid: uuid(),
        })) as TxObject;

        assert(swapParams.to !== undefined, 'Missing `to` in tx params');

        const tenderlySimulator = TenderlySimulator.getInstance();
        const stateOverride: StateOverride = {};
        const amountToFund = BigInt(route.srcAmount) * 2n;

        if (route.srcToken.toLowerCase() === ETHER_ADDRESS) {
          // add eth balance to user
          tenderlySimulator.addBalanceOverride(
            stateOverride,
            userAddress,
            amountToFund,
          );
        } else {
          await tenderlySimulator.addTokenBalanceOverride(
            stateOverride,
            network,
            route.srcToken,
            userAddress,
            amountToFund,
          );
          await tenderlySimulator.addAllowanceOverride(
            stateOverride,
            network,
            route.srcToken,
            userAddress,
            priceRoute.contractAddress,
            amountToFund,
          );
        }

        const { simulation } = await tenderlySimulator.simulateTransaction({
          chainId: network,
          from: swapParams.from,
          to: swapParams.to,
          data: swapParams.data,
          value: swapParams.value,
          blockNumber: route.blockNumber,
          stateOverride,
        });

        expect(simulation.status).toEqual(true);
      }, 120000);
    });
  });
});
