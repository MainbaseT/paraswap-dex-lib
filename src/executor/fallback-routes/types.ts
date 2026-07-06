import { OptimalRate } from '@paraswap/core';

/**
 * Declarative spec for a manufactured fallback test route.
 *
 * Every scenario is a SELL route along `path`. Each hop is priced live (per
 * split slice) with a real AMM; the hop/member marked `fabricated` becomes a
 * `Native` swapExchange with an always-reverting quote carrying the real
 * priced quote as its revertable fallback.
 */
export type HopSpec = {
  // Percentage split of this hop across members (must sum to 100). Default [100].
  split?: number[];
  // Index of the split member to fabricate as the always-reverting fallbackable
  // primary (its real quote becomes the fallback). Omit for an all-real hop.
  fabricatedMemberIndex?: number;
};

export type ScenarioSpec = {
  // Readable unique id, e.g. 'multihop-fallback-first-hop'
  name: string;
  description: string;
  // Token symbols from tests/constants-e2e, e.g. ['USDC', 'WETH', 'WBTC']
  path: string[];
  // Raw src amount (wei of path[0])
  amount: string;
  // One entry per hop (path.length - 1)
  hops: HopSpec[];
  // BPS subtracted from quoted destAmount for min-out. Default 300.
  slippageBps?: number;
};

export type GeneratedRoute = {
  name: string;
  description: string;
  network: number;
  generatedAt: string;
  slippageBps: number;
  priceRoute: OptimalRate;
};

export type GeneratedRoutesFile = {
  _readme: string;
  routes: GeneratedRoute[];
};
