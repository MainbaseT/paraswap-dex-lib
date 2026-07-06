/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config();

/**
 * Fallback test-route generator.
 *
 * For each scenario in ./scenarios.ts: price every hop (and split slice) live
 * on Arbitrum via LocalParaswapSDK, assemble a multi-hop OptimalRate, and
 * replace the marked member with a fabricated always-reverting `Native` quote
 * whose revertable fallback is the real priced quote. Writes ./routes.json,
 * consumed by src/executor/fallback-routes-live-e2e.test.ts.
 *
 * Run:  GENERATE_FALLBACK_ROUTES=1 npx jest src/executor/fallback-routes/generate-routes.test.ts --forceExit
 * Requires .env: HTTP_PROVIDER_42161.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Interface } from '@ethersproject/abi';
import { OptimalRate, OptimalSwap, ParaSwapVersion } from '@paraswap/core';
import { LocalParaswapSDK } from '../../implementations/local-paraswap-sdk';
import { ContractMethod, Network, SwapSide } from '../../constants';
import { Token } from '../../types';
import { isETHAddress } from '../../utils';
import { OptimalSwapExchangeWithFallback } from '../../types';
import { SCENARIOS } from './scenarios';
import { GeneratedRoute, GeneratedRoutesFile, ScenarioSpec } from './types';

const NETWORK = Network.ARBITRUM;
const PRICING_DEX = 'UniswapV3';
const AUGUSTUS_V6 = '0x6a000f20005980200259b80c5102003040001068';
const WETH_ARBITRUM = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';

// Local token map (generate.ts is compiled as source, so it cannot import
// tests/constants-e2e which lives outside the tsconfig rootDir).
const TOKENS: Record<string, Token> = {
  ETH: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
  },
  WETH: { address: WETH_ARBITRUM, decimals: 18 },
  USDC: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
  },
  USDT: {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    decimals: 6,
  },
  WBTC: {
    address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    decimals: 8,
  },
};

const erc20 = new Interface(['function transferFrom(address,address,uint256)']);

// A quote whose calldata always reverts on-chain: transferFrom with no allowance.
function fabricatedRevertingQuote(hopSrcToken: string, amount: bigint) {
  return {
    quote: {
      txRequest: {
        // eee has no code — use WETH as the reverting ERC20 target for ETH hops
        target: isETHAddress(hopSrcToken) ? WETH_ARBITRUM : hopSrcToken,
        calldata: erc20.encodeFunctionData('transferFrom', [
          '0x000000000000000000000000000000000000dEaD',
          '0x000000000000000000000000000000000000bEEF',
          amount,
        ]),
        value: '0',
      },
    },
  };
}

// One SDK (with initialized pricing) per venue, created lazily.
class SdkRegistry {
  private sdks: Record<string, LocalParaswapSDK> = {};

  async get(dexKey: string): Promise<LocalParaswapSDK> {
    if (!this.sdks[dexKey]) {
      const sdk = new LocalParaswapSDK(NETWORK, [dexKey], '');
      await sdk.initializePricing?.();
      this.sdks[dexKey] = sdk;
    }
    return this.sdks[dexKey];
  }

  async release(): Promise<void> {
    for (const sdk of Object.values(this.sdks)) {
      await sdk.releaseResources?.();
    }
  }
}

async function generateScenario(
  sdks: SdkRegistry,
  spec: ScenarioSpec,
): Promise<GeneratedRoute> {
  const tokens = TOKENS;
  if (spec.hops.length !== spec.path.length - 1) {
    throw new Error(`${spec.name}: hops must match path segments`);
  }

  let runningAmount = BigInt(spec.amount);
  let blockNumber = 0;
  const swaps: OptimalSwap[] = [];

  for (let i = 0; i < spec.hops.length; i++) {
    const hop = spec.hops[i];
    const from = tokens[spec.path[i]];
    const to = tokens[spec.path[i + 1]];
    const split = hop.split ?? [100];
    if (split.reduce((a, b) => a + b, 0) !== 100) {
      throw new Error(`${spec.name}: hop ${i} split must sum to 100`);
    }

    // Slice amounts; last slice takes the remainder to preserve the total.
    const slices = split.map(p => (runningAmount * BigInt(p)) / 100n);
    slices[slices.length - 1] =
      runningAmount - slices.slice(0, -1).reduce((a, b) => a + b, 0n);

    const members: OptimalSwapExchangeWithFallback[] = [];
    let hopDestTotal = 0n;

    const priceSlice = async (dexKey: string, amount: bigint) => {
      const sdk = await sdks.get(dexKey);
      const priced = await sdk.getPrices(
        from,
        to,
        amount,
        SwapSide.SELL,
        ContractMethod.swapExactAmountIn,
      );
      blockNumber = priced.blockNumber;
      return priced.bestRoute[0].swaps[0].swapExchanges[0];
    };

    for (let j = 0; j < slices.length; j++) {
      const memberDex = hop.pricingDexes?.[j] ?? PRICING_DEX;
      const realSe = await priceSlice(memberDex, slices[j]);
      const member: OptimalSwapExchangeWithFallback = {
        ...realSe,
        srcAmount: slices[j].toString(),
        percent: split[j],
      };

      if (hop.fabricatedMemberIndex === j) {
        // The fallback may be priced on a different venue (e.g. a raw-ETH one).
        const fallbackSe = hop.fallbackPricingDex
          ? {
              ...(await priceSlice(hop.fallbackPricingDex, slices[j])),
              srcAmount: slices[j].toString(),
              percent: split[j],
            }
          : member;
        hopDestTotal += BigInt(fallbackSe.destAmount);
        members.push({
          exchange: 'Native',
          srcAmount: member.srcAmount,
          destAmount: fallbackSe.destAmount,
          percent: split[j],
          data: fabricatedRevertingQuote(from.address, slices[j]),
          fallback: fallbackSe, // the real quote is the revertable fallback
        });
      } else {
        hopDestTotal += BigInt(realSe.destAmount);
        members.push(member);
      }
    }

    swaps.push({
      srcToken: from.address,
      srcDecimals: from.decimals,
      destToken: to.address,
      destDecimals: to.decimals,
      swapExchanges: members,
    });
    runningAmount = hopDestTotal;
  }

  const src = tokens[spec.path[0]];
  const dest = tokens[spec.path[spec.path.length - 1]];
  const priceRoute = {
    blockNumber,
    network: NETWORK,
    srcToken: src.address,
    srcDecimals: src.decimals,
    srcAmount: spec.amount,
    destToken: dest.address,
    destDecimals: dest.decimals,
    destAmount: runningAmount.toString(),
    bestRoute: [{ percent: 100, swaps }],
    gasCostUSD: '0',
    gasCost: '0',
    others: [],
    side: SwapSide.SELL,
    contractAddress: AUGUSTUS_V6,
    tokenTransferProxy: '',
    version: ParaSwapVersion.V6,
    contractMethod: ContractMethod.swapExactAmountIn,
    partner: 'test',
    maxImpactReached: false,
    hmac: '0',
    srcUSD: '0',
    destUSD: '0',
  } as unknown as OptimalRate;

  return {
    name: spec.name,
    description: spec.description,
    network: NETWORK,
    generatedAt: new Date().toISOString(),
    slippageBps: spec.slippageBps ?? 300,
    expectGroup: spec.expectGroup ?? true,
    expectSuccess: spec.expectSuccess ?? true,
    priceRoute,
  };
}

export async function generateAllRoutes(): Promise<{
  routes: GeneratedRoute[];
  failures: string[];
}> {
  const sdks = new SdkRegistry();

  const routes: GeneratedRoute[] = [];
  const failures: string[] = [];
  try {
    for (const spec of SCENARIOS) {
      try {
        console.log(`generating: ${spec.name} ...`);
        routes.push(await generateScenario(sdks, spec));
      } catch (e) {
        console.error(`FAILED: ${spec.name}:`, e);
        failures.push(spec.name);
      }
    }
  } finally {
    await sdks.release();
  }

  const out: GeneratedRoutesFile = {
    _readme:
      'GENERATED by src/executor/fallback-routes/generate.ts — do not edit by hand. ' +
      'Manufactured fallback test routes: each marked member is a Native swapExchange ' +
      'with an always-reverting quote whose `fallback` is a real quote priced at the ' +
      'pinned blockNumber. Regenerate when routes go stale: ' +
      'GENERATE_FALLBACK_ROUTES=1 npx jest src/executor/fallback-routes/generate-routes.test.ts --forceExit',
    routes,
  };
  const outPath = path.join(__dirname, 'routes.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(
    `\nwrote ${routes.length}/${SCENARIOS.length} routes to ${outPath}` +
      (failures.length ? `\nfailed: ${failures.join(', ')}` : ''),
  );
  return { routes, failures };
}
