import dotenv from 'dotenv';
dotenv.config();

import { Interface } from '@ethersproject/abi';
import { SwapSide, Network } from '../../constants';
import { DummyDexHelper } from '../../dex-helper/index';
import { PancakeSwapInfinity } from './pancakeswap-infinity';
import { PancakeSwapInfinityData } from './types';
import { PancakeSwapInfinityConfig } from './config';
import RouterAbi from '../../abi/uniswap-v4/router.abi.json';

const network = Network.BSC;
const routerAddress =
  PancakeSwapInfinityConfig.PancakeSwapInfinity[network].router;
const routerIface = new Interface(RouterAbi);

// ERC20/ERC20 pool (no native currency)
const poolKey = {
  currency0: '0x55d398326f99059ff775485246999027b3197955',
  currency1: '0x7ec43cf65f1663f820427c62a5780b8f2e25593a',
  hooks: '0x9a9b5331ce8d74b2b721291d57de696e878353fd',
  poolManager: '0xa0ffb9c1ce1fe56963b0321b32e7a0302114058b',
  fee: 67,
  parameters:
    '0x00000000000000000000000000000000000000000000000000000000000a0055',
};

// Native BNB / CAKE pool (currency0 = address(0))
const nativePoolKey = {
  currency0: '0x0000000000000000000000000000000000000000',
  currency1: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
  hooks: '0x0000000000000000000000000000000000000000',
  poolManager: '0xa0ffb9c1ce1fe56963b0321b32e7a0302114058b',
  fee: 335,
  parameters:
    '0x0000000000000000000000000000000000000000000000000000000000010000',
};

describe('PancakeSwapInfinity Integration', () => {
  let dex: PancakeSwapInfinity;

  beforeAll(() => {
    const dexHelper = new DummyDexHelper(network);
    dex = new PancakeSwapInfinity(dexHelper);
  });

  describe('getDexParam', () => {
    it('should encode SELL via Universal Router execute()', () => {
      const srcToken = '0x7ec43cf65f1663f820427c62a5780b8f2e25593a';
      const destToken = '0x55d398326f99059ff775485246999027b3197955';
      const srcAmount = '159095257075217814406';
      const recipient = '0x0000000000000000000000000000000000000001';

      const data: PancakeSwapInfinityData = {
        poolKey,
        zeroForOne: false,
        hookData: '0x',
      };

      const result = dex.getDexParam(
        srcToken,
        destToken,
        srcAmount,
        '0',
        recipient,
        data,
        SwapSide.SELL,
      );

      expect(result.targetExchange).toBe(routerAddress);
      expect(result.dexFuncHasRecipient).toBe(true);
      expect(result.needWrapNative).toBe(false);
      expect(result.skipApproval).toBe(true);
      expect(result.transferSrcTokenBeforeSwap).toBe(routerAddress);

      // Verify it decodes as execute(bytes,bytes[])
      const decoded = routerIface.decodeFunctionData(
        'execute(bytes,bytes[])',
        result.exchangeData,
      );
      const commands = decoded[0]; // bytes commands
      const inputs = decoded[1]; // bytes[] inputs

      // Single command: V4_SWAP (0x10)
      expect(commands).toBe('0x10');
      expect(inputs.length).toBe(1);
    });

    it('should encode BUY via Universal Router with SWEEP', () => {
      const srcToken = '0x7ec43cf65f1663f820427c62a5780b8f2e25593a';
      const destToken = '0x55d398326f99059ff775485246999027b3197955';
      const srcAmount = '200000000000000000000';
      const destAmount = '59000000000000000000';
      const recipient = '0x0000000000000000000000000000000000000001';

      const data: PancakeSwapInfinityData = {
        poolKey,
        zeroForOne: false,
      };

      const result = dex.getDexParam(
        srcToken,
        destToken,
        srcAmount,
        destAmount,
        recipient,
        data,
        SwapSide.BUY,
      );

      const decoded = routerIface.decodeFunctionData(
        'execute(bytes,bytes[])',
        result.exchangeData,
      );
      const commands = decoded[0];

      // Commands: V4_SWAP (0x10) + SWEEP (0x04)
      expect(commands).toBe('0x1004');
      expect(decoded[1].length).toBe(2);
    });

    it('should not add WRAP_ETH for ETH src + native pool', () => {
      const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      const destToken = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82';

      const data: PancakeSwapInfinityData = {
        poolKey: nativePoolKey,
        zeroForOne: true,
      };

      const result = dex.getDexParam(
        ethAddress,
        destToken,
        '1000000000000000000',
        '0',
        '0x0000000000000000000000000000000000000001',
        data,
        SwapSide.SELL,
      );

      expect(result.transferSrcTokenBeforeSwap).toBeUndefined();

      const decoded = routerIface.decodeFunctionData(
        'execute(bytes,bytes[])',
        result.exchangeData,
      );
      const commands = decoded[0];

      // ETH src + native pool (address 0): no WRAP needed, just V4_SWAP
      expect(commands).toBe('0x10');
      expect(decoded[1].length).toBe(1);
    });

    it('should not add UNWRAP_WETH for ETH dest + native pool', () => {
      const srcToken = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82';
      const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

      const data: PancakeSwapInfinityData = {
        poolKey: nativePoolKey,
        zeroForOne: false,
      };

      const result = dex.getDexParam(
        srcToken,
        ethAddress,
        '1000000000000000000',
        '0',
        '0x0000000000000000000000000000000000000001',
        data,
        SwapSide.SELL,
      );

      const decoded = routerIface.decodeFunctionData(
        'execute(bytes,bytes[])',
        result.exchangeData,
      );
      const commands = decoded[0];

      // ETH dest + native pool (address 0): no UNWRAP needed, just V4_SWAP
      expect(commands).toBe('0x10');
      expect(decoded[1].length).toBe(1);
    });
  });

  describe('getAdapterParam', () => {
    it('should return stub with correct targetExchange', () => {
      const data: PancakeSwapInfinityData = {
        poolKey,
        zeroForOne: false,
      };

      const result = dex.getAdapterParam(
        '0x55d398326f99059ff775485246999027b3197955',
        '0x7ec43cf65f1663f820427c62a5780b8f2e25593a',
        '1000',
        '1000',
        data,
        SwapSide.SELL,
      );

      expect(result.targetExchange).toBe(routerAddress);
      expect(result.payload).toBe('0x');
      expect(result.networkFee).toBe('0');
    });
  });

  describe('getSimpleParam', () => {
    it('should return empty stub', async () => {
      const data: PancakeSwapInfinityData = {
        poolKey,
        zeroForOne: false,
      };

      const result = await dex.getSimpleParam(
        '0x55d398326f99059ff775485246999027b3197955',
        '0x7ec43cf65f1663f820427c62a5780b8f2e25593a',
        '1000',
        '1000',
        data,
        SwapSide.SELL,
      );

      expect(result.callees).toEqual([]);
      expect(result.calldata).toEqual([]);
      expect(result.values).toEqual([]);
      expect(result.networkFee).toBe('0');
    });
  });
});
