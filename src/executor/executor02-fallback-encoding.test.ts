import dotenv from 'dotenv';
dotenv.config();

import { Executor02BytecodeBuilder } from './Executor02BytecodeBuilder';
import { Network, NULL_ADDRESS } from '../constants';
import { DummyDexHelper } from '../dex-helper';

import { OptimalRate } from '@paraswap/core';
import { DexExchangeBuildParam } from '../types';
import { DepositWithdrawReturn } from '../dex/weth/types';

import priceRoute from './fixtures/executor02/routes/price-route-multiSwap-univ3-sushiv3-sushi-eth-wbtc.json';
import exchangeParams from './fixtures/executor02/exchange-params/price-route-multiSwap-univ3-sushiv3-sushi-eth-wbtc.json';
import maybeWethCallData from './fixtures/executor02/maybe-weth-calldata/price-route-multiSwap-univ3-sushiv3-sushi-eth-wbtc.json';

// Group step metadata (hex, no 0x): [target=20 zero bytes][size(4)][fromAmtPos(2)=0]
// [destTokenPos(2)][returnAmountPos(1)=0][specialDex(1)=ff][flag(2)]
const GROUP_STEP_RE = /0{40}([0-9a-f]{8})0000([0-9a-f]{4})00ff([0-9a-f]{4})/;

describe('Executor02BytecodeBuilder revertable fallback group', () => {
  let builder: Executor02BytecodeBuilder;

  beforeEach(() => {
    builder = new Executor02BytecodeBuilder(
      new DummyDexHelper(Network.MAINNET),
    );
  });

  const route = priceRoute as unknown as OptimalRate;
  const primary = exchangeParams as unknown as DexExchangeBuildParam[];
  const weth = maybeWethCallData as unknown as DepositWithdrawReturn;

  // The last swap (ETH -> WBTC) is single-exchange: flat param index 2. Attach a
  // fallback alternative with a distinct target so its block differs.
  const withFallback = () => {
    const params = primary.map(p => ({ ...p }));
    params[2].fallbackParam = {
      ...primary[2],
      targetExchange: '0x1111111111111111111111111111111111111111',
    };
    return params;
  };

  it('encodes a 0xFF group step for the single-exchange swap carrying a fallback', () => {
    const plain = builder.buildByteCode(route, primary, NULL_ADDRESS, weth);
    const grouped = builder.buildByteCode(
      route,
      withFallback(),
      NULL_ADDRESS,
      weth,
    );

    expect(grouped).not.toEqual(plain);
    expect(plain.replace('0x', '')).not.toMatch(GROUP_STEP_RE);

    const match = grouped.replace('0x', '').match(GROUP_STEP_RE);
    expect(match).not.toBeNull();

    const [, sizeHex] = match!;
    const size = parseInt(sizeHex, 16);

    // Payload = [28-byte padding][tryLen(4)][fallbackLen(4)][try][fallback](+optional
    // appended token). Read the lengths right after the padding and reconcile.
    const stepStart = match!.index!;
    const payload = grouped
      .replace('0x', '')
      .slice(stepStart + 64 /* metadata word */ + 56 /* 28-byte padding */);
    const tryLen = parseInt(payload.slice(0, 8), 16);
    const fallbackLen = parseInt(payload.slice(8, 16), 16);

    expect(tryLen).toBeGreaterThan(0);
    expect(fallbackLen).toBeGreaterThan(0);
    // size covers padding(28) + lengths(8) + both blocks (+ appended token if any)
    expect(size).toBeGreaterThanOrEqual(36 + tryLen + fallbackLen);

    // The fallback block encodes the substituted target.
    const blocks = payload.slice(16, 16 + (tryLen + fallbackLen) * 2);
    expect(blocks).toContain('1111111111111111111111111111111111111111');
  });
});
