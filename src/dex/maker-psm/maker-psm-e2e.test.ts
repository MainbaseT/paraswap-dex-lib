import dotenv from 'dotenv';
dotenv.config();

import { testE2E } from '../../../tests/utils-e2e';
import {
  Tokens,
  Holders,
  NativeTokenSymbols,
} from '../../../tests/constants-e2e';
import { Network, ContractMethod, SwapSide } from '../../constants';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { generateConfig } from '../../config';

describe('MakerPsm E2E', () => {
  const dexKey = 'MakerPsm';

  describe('MakerPsm MAINNET_V6', () => {
    const network = Network.MAINNET;
    const tokens = Tokens[network];
    const holders = Holders[network];
    const provider = new StaticJsonRpcProvider(
      generateConfig(network).privateHttpProvider,
      network,
    );

    const tokenASymbol: string = 'USDC';
    const tokenBSymbol: string = 'DAI';
    const nativeTokenSymbol = 'ETH';

    const tokenAAmount: string = '1000000000';
    const tokenBAmount: string = '1000000000000000000';
    const nativeTokenAmount: string = '1000000000000000000';

    const sideToContractMethods = new Map([
      [
        SwapSide.SELL,
        [
          ContractMethod.swapExactAmountIn,
          // ContractMethod.simpleSwap,
          // ContractMethod.multiSwap,
          // ContractMethod.megaSwap,
        ],
      ],
      // [SwapSide.BUY, [ContractMethod.simpleBuy, ContractMethod.buy]],
      [SwapSide.BUY, [ContractMethod.swapExactAmountOut]],
    ]);

    sideToContractMethods.forEach((contractMethods, side) =>
      contractMethods.forEach((contractMethod: ContractMethod) => {
        describe(`${contractMethod}`, () => {
          it(`${tokenASymbol} -> ${tokenBSymbol}`, async () => {
            await testE2E(
              tokens[tokenASymbol],
              tokens[tokenBSymbol],
              holders[tokenASymbol],
              side === SwapSide.SELL ? tokenAAmount : tokenBAmount,
              side,
              dexKey,
              contractMethod,
              network,
              provider,
            );
          });

          it(`${tokenBSymbol} -> ${tokenASymbol}`, async () => {
            await testE2E(
              tokens[tokenBSymbol],
              tokens[tokenASymbol],
              holders[tokenBSymbol],
              side === SwapSide.SELL ? tokenBAmount : tokenAAmount,
              side,
              dexKey,
              contractMethod,
              network,
              provider,
            );
          });
          // it(`${nativeTokenSymbol} -> ${tokenASymbol}`, async () => {
          //   await testE2E(
          //     tokens[nativeTokenSymbol],
          //     tokens[tokenASymbol],
          //     holders[nativeTokenSymbol],
          //     side === SwapSide.SELL ? nativeTokenAmount : tokenAAmount,
          //     side,
          //     dexKey,
          //     contractMethod,
          //     network,
          //     provider,
          //   );
          // });
          // it(`${tokenASymbol} -> ${nativeTokenSymbol}`, async () => {
          //   await testE2E(
          //     tokens[tokenASymbol],
          //     tokens[nativeTokenSymbol],
          //     holders[tokenASymbol],
          //     side === SwapSide.SELL ? tokenAAmount : nativeTokenAmount,
          //     side,
          //     dexKey,
          //     contractMethod,
          //     network,
          //     provider,
          //   );
          // });
        });
      }),
    );
  });
});
