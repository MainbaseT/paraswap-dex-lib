import dotenv from 'dotenv';
dotenv.config();

import { Executor01BytecodeBuilder } from './Executor01BytecodeBuilder';
import { Network, NULL_ADDRESS } from '../constants';
import { DummyDexHelper } from '../dex-helper';

import { OptimalRate } from '@paraswap/core';
import { DexExchangeBuildParam } from '../types';

import priceRoute from './fixtures/executor01/routes/price-route-simpleSwap-univ3-usdc-usdt.json';
import exchangeParams from './fixtures/executor01/exchange-params/price-route-simpleSwap-univ3-usdc-usdt.json';

// Strip the outer [offset(32)][length(32)] wrapper that buildByteCode prepends,
// leaving just the swaps calldata (the concatenated steps).
const innerSteps = (bytecode: string): string => bytecode.slice(2 + 64 + 64);
const byteLen = (hexNoPrefix: string): number => hexNoPrefix.length / 2;

describe('Executor01BytecodeBuilder revertable fallback group (Style 2)', () => {
  let builder: Executor01BytecodeBuilder;

  beforeEach(() => {
    builder = new Executor01BytecodeBuilder(
      new DummyDexHelper(Network.MAINNET),
    );
  });

  const primary = exchangeParams as unknown as DexExchangeBuildParam[];
  // A distinct fallback alternative for the same hop (different target address
  // so its encoded block differs from the primary's).
  const fallback = [
    {
      ...primary[0],
      targetExchange: '0x1111111111111111111111111111111111111111',
    },
  ] as unknown as DexExchangeBuildParam[];

  it('encodes the group as a 0xFF special-dex step carrying both sub-blocks', () => {
    const route = priceRoute as unknown as OptimalRate;

    const tryBlock = innerSteps(
      builder.buildByteCode(route, primary, NULL_ADDRESS, undefined),
    );
    const fallbackBlock = innerSteps(
      builder.buildByteCode(route, fallback, NULL_ADDRESS, undefined),
    );

    const grouped = builder.buildByteCode(
      route,
      [
        { ...primary[0], fallbackParam: fallback[0] },
      ] as unknown as DexExchangeBuildParam[],
      NULL_ADDRESS,
      undefined,
    );
    const step = innerSteps(grouped);

    // The group differs from the plain primary-only encoding.
    expect(grouped).not.toEqual(
      builder.buildByteCode(route, primary, NULL_ADDRESS, undefined),
    );

    // --- metadata word (EXECUTOR_01_02 layout) ---
    // [addr(20)][size(4)][fromAmtPos(2)][srcTokPos(2)][retPos(1)][specialDex(1)][flag(2)][zeros(28)][payload]
    const addr = step.slice(0, 40);
    const sizeHex = step.slice(40, 48);
    const specialDex = step.slice(58, 60);

    expect(addr).toBe('0'.repeat(40)); // target unused for a group
    expect(specialDex).toBe('ff'); // REVERTABLE_FALLBACK_GROUP

    // --- payload: [28-byte padding][tryLen(4)][fallbackLen(4)][tryBlock][fallbackBlock] ---
    const PADDING = 28 * 2; // hex chars
    const payload = step.slice(64 /* metadata word */ + PADDING);

    const tryLen = parseInt(payload.slice(0, 8), 16);
    const fallbackLen = parseInt(payload.slice(8, 16), 16);
    const blocks = payload.slice(16);

    expect(tryLen).toBe(byteLen(tryBlock));
    expect(fallbackLen).toBe(byteLen(fallbackBlock));
    expect(blocks.slice(0, tryBlock.length)).toBe(tryBlock);
    expect(blocks.slice(tryBlock.length)).toBe(fallbackBlock);

    // calldataSize in the metadata word = payload bytes + 28 (standard packing).
    expect(parseInt(sizeHex, 16)).toBe(byteLen(payload) + 28);
  });
});
