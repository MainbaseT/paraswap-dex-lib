import { Address } from '../../types';

export type DexParams = {
  clPoolManager: Address;
  router: Address;
  subgraphURL: string;
};

export type SubgraphConnectorPool = {
  id: string;
  totalValueLockedUSD: string;
  token0: {
    address: string;
    decimals: string;
  };
  token1: {
    address: string;
    decimals: string;
  };
};

export type PoolKey = {
  currency0: string;
  currency1: string;
  hooks: string;
  poolManager: string;
  fee: number;
  parameters: string; // bytes32
};

export type PancakeSwapInfinityData = {
  poolKey: PoolKey;
  zeroForOne: boolean;
  hookData?: string;
};
