/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config();

import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Holders, Tokens } from '../../../tests/constants-e2e';
import { testE2E } from '../../../tests/utils-e2e';
import { generateConfig } from '../../config';
import { ContractMethod, Network, SwapSide } from '../../constants';
import { PoolConfig, PoolKey } from './pools/utils';
import { BI_POWS } from '../../bigint-constants';
import { DEX_KEY, EKUBO_CONFIG } from './config';

const NETWORK = Network.MAINNET;

describe('Ekubo E2E', () => {
  describe('Mainnet', () => {
    const tokens = Tokens[NETWORK];
    const config = EKUBO_CONFIG[DEX_KEY][NETWORK];

    const tokensToTest = [
      {
        pair: [
          {
            symbol: 'USDC',
            amount: '10000000',
          },
          {
            symbol: 'USDT',
            amount: '10000000',
          },
        ],
      },
      {
        pair: [
          {
            symbol: 'ETH',
            amount: '1000000000000000',
          },
          {
            symbol: 'USDC',
            amount: '10000000',
          },
        ],
        // ETH/USDC 0.05% fee TWAMM pool
        limitPools: [
          new PoolKey(
            0n,
            0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48n,
            new PoolConfig(
              0,
              9223372036854775n,
              0xd4279c050da1f5c5b2830558c7a08e57e12b54ecn,
            ),
          ).string_id,
        ],
      },
      {
        pair: [
          {
            symbol: 'EKUBO',
            amount: BI_POWS[18],
          },
          {
            symbol: 'ebUSD',
            amount: BI_POWS[19],
          },
        ],
        limitPools: [
          new PoolKey(
            BigInt(tokens['EKUBO'].address),
            BigInt(tokens['ebUSD'].address),
            new PoolConfig(500, 1844674407370955n, BigInt(config.mevResist)),
          ).string_id,
        ],
      },
    ];

    const provider = new StaticJsonRpcProvider(
      generateConfig(NETWORK).privateHttpProvider,
      NETWORK,
    );
    const holders = Holders[NETWORK];

    const sideToContractMethods = new Map([
      [SwapSide.SELL, [ContractMethod.swapExactAmountIn]],
      [SwapSide.BUY, [ContractMethod.swapExactAmountOut]],
    ]);

    sideToContractMethods.forEach((contractMethods, side) =>
      describe(`${side}`, () => {
        contractMethods.forEach((contractMethod: ContractMethod) => {
          describe(`${contractMethod}`, () => {
            function test(
              srcTokenSymbol: string,
              destTokenSymbol: string,
              amount: string,
              side: SwapSide,
              poolIdentifiers?: string[],
            ) {
              return testE2E(
                tokens[srcTokenSymbol],
                tokens[destTokenSymbol],
                holders[srcTokenSymbol],
                amount,
                side,
                DEX_KEY,
                contractMethod,
                NETWORK,
                provider,
                poolIdentifiers && { [DEX_KEY]: poolIdentifiers },
              );
            }

            tokensToTest.forEach(({ pair: [tokenA, tokenB], limitPools }) => {
              it(`${tokenA.symbol} -> ${tokenB.symbol}`, () =>
                test(
                  tokenA.symbol,
                  tokenB.symbol,
                  String(
                    side === SwapSide.SELL ? tokenA.amount : tokenB.amount,
                  ),
                  side,
                  limitPools,
                ));
              it(`${tokenB.symbol} -> ${tokenA.symbol}`, () =>
                test(
                  tokenB.symbol,
                  tokenA.symbol,
                  String(
                    side === SwapSide.SELL ? tokenB.amount : tokenA.amount,
                  ),
                  side,
                  limitPools,
                ));
            });
          });
        });
      }),
    );
  });
});
