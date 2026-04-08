import { NumberAsString, SwapSide } from '@paraswap/core';
import {
  AdapterExchangeParam,
  Address,
  DexExchangeParam,
  SimpleExchangeParam,
} from '../../types';
import { IDexTxBuilder } from '../idex';
import { IDexHelper } from '../../dex-helper';
import { PancakeSwapInfinityData } from './types';
import { PancakeSwapInfinityConfig } from './config';
import { isETHAddress } from '../../utils';
import {
  swapExactInputSingleCalldata,
  swapExactOutputSingleCalldata,
} from './encoder';

export class PancakeSwapInfinity
  implements IDexTxBuilder<PancakeSwapInfinityData, any>
{
  static dexKeys = ['pancakeswapinfinity'];

  needWrapNative = false;

  private readonly network: number;
  private readonly wethAddress: string;
  private readonly routerAddress: string;

  constructor(dexHelper: IDexHelper) {
    this.network = dexHelper.config.data.network;
    this.wethAddress =
      dexHelper.config.data.wrappedNativeTokenAddress.toLowerCase();

    const config = PancakeSwapInfinityConfig.PancakeSwapInfinity[this.network];
    this.routerAddress = config.router;
  }

  getAdapterParam(
    _srcToken: Address,
    _destToken: Address,
    _srcAmount: NumberAsString,
    _destAmount: NumberAsString,
    _data: PancakeSwapInfinityData,
    _side: SwapSide,
  ): AdapterExchangeParam {
    return {
      targetExchange: this.routerAddress,
      payload: '0x',
      networkFee: '0',
    };
  }

  async getSimpleParam(
    _srcToken: Address,
    _destToken: Address,
    _srcAmount: NumberAsString,
    _destAmount: NumberAsString,
    _data: PancakeSwapInfinityData,
    _side: SwapSide,
  ): Promise<SimpleExchangeParam> {
    return {
      callees: [],
      calldata: [],
      values: [],
      networkFee: '0',
    };
  }

  getDexParam(
    srcToken: Address,
    destToken: Address,
    srcAmount: NumberAsString,
    destAmount: NumberAsString,
    recipient: Address,
    data: PancakeSwapInfinityData,
    side: SwapSide,
  ): DexExchangeParam {
    const exchangeData =
      side === SwapSide.SELL
        ? swapExactInputSingleCalldata(
            srcToken,
            destToken,
            data,
            BigInt(srcAmount),
            0n,
            recipient,
            this.wethAddress,
          )
        : swapExactOutputSingleCalldata(
            srcToken,
            destToken,
            data,
            BigInt(srcAmount),
            BigInt(destAmount),
            recipient,
            this.wethAddress,
          );

    return {
      needWrapNative: this.needWrapNative,
      sendEthButSupportsInsertFromAmount: true,
      dexFuncHasRecipient: true,
      exchangeData,
      targetExchange: this.routerAddress,
      returnAmountPos: undefined,
      transferSrcTokenBeforeSwap: isETHAddress(srcToken)
        ? undefined
        : this.routerAddress,
      skipApproval: true,
    };
  }
}
