import { ScenarioSpec } from './types';

const USDC_10 = (10n * 10n ** 6n).toString();
const USDT_10 = (10n * 10n ** 6n).toString();
const ETH_0_01 = (10n ** 16n).toString();

/**
 * The fallback test matrix. All SELL, Arbitrum, priced on UniswapV3.
 *
 * Executor mapping: 100%-per-hop routes -> Executor01; any split -> Executor02.
 */
export const SCENARIOS: ScenarioSpec[] = [
  {
    name: 'single-hop-fallback',
    description:
      'E01 whole-hop group: single USDC->WETH hop, primary reverts, fallback fills',
    path: ['USDC', 'WETH'],
    amount: USDC_10,
    hops: [{ fabricatedMemberIndex: 0 }],
  },
  {
    name: 'multihop-fallback-first-hop',
    description:
      'E01 group at sequence START: USDC->WETH->WBTC, hop0 falls back, its output threads to hop1',
    path: ['USDC', 'WETH', 'WBTC'],
    amount: USDC_10,
    hops: [{ fabricatedMemberIndex: 0 }, {}],
  },
  {
    name: 'multihop-fallback-last-hop',
    description:
      'E01 group at sequence END: USDC->WETH->WBTC, hop1 falls back after a real hop0',
    path: ['USDC', 'WETH', 'WBTC'],
    amount: USDC_10,
    hops: [{}, { fabricatedMemberIndex: 0 }],
  },
  {
    name: 'multihop-fallback-middle-hop',
    description:
      'E01 group in sequence MIDDLE: USDT->USDC->WETH->WBTC, hop1 falls back between real hops',
    path: ['USDT', 'USDC', 'WETH', 'WBTC'],
    amount: USDT_10,
    hops: [{}, { fabricatedMemberIndex: 0 }, {}],
  },
  {
    name: 'eth-src-wrap-in-try',
    description:
      'E01 wrap rollback: ETH->USDC, primary (needs WETH) wraps inside the try; on revert the wrap rolls back and the fallback re-wraps',
    path: ['ETH', 'USDC'],
    amount: ETH_0_01,
    hops: [{ fabricatedMemberIndex: 0 }],
  },
  {
    name: 'eth-dest-unwrap',
    description:
      'E01 unwrap side: USDC->ETH, primary and fallback both WETH-based (same wrap-ness), unwrap-after machinery',
    path: ['USDC', 'ETH'],
    amount: USDC_10,
    hops: [{ fabricatedMemberIndex: 0 }],
  },
  {
    name: 'split-member-fallback',
    description:
      'E02 group nested in a path: USDC->WETH split 50/50, member 0 falls back, sibling unaffected',
    path: ['USDC', 'WETH'],
    amount: USDC_10,
    hops: [{ split: [50, 50], fabricatedMemberIndex: 0 }],
  },
  {
    name: 'multihop-split-then-fallback-hop',
    description:
      'E02 WHOLE-HOP group with threading flag: USDC->WETH->WBTC, hop0 split 50/50 (all real), hop1 single fabricated',
    path: ['USDC', 'WETH', 'WBTC'],
    amount: USDC_10,
    hops: [{ split: [50, 50] }, { fabricatedMemberIndex: 0 }],
  },
  {
    name: 'eth-src-split-member-fallback',
    description:
      'E02 input normalization: ETH->USDC split 50/50, member 0 falls back; external wrap persists, fallback gets its approve prepended',
    path: ['ETH', 'USDC'],
    amount: ETH_0_01,
    hops: [{ split: [50, 50], fabricatedMemberIndex: 0 }],
  },
];
