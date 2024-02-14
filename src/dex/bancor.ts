import { Interface, JsonFragment } from '@ethersproject/abi';
import { NULL_ADDRESS, SwapSide } from '../constants';
import {
  AdapterExchangeParam,
  Address,
  DexExchangeParam,
  NumberAsString,
  SimpleExchangeParam,
} from '../types';
import { IDexTxBuilder } from './idex';
import { SimpleExchange } from './simple-exchange';
import BancorABI from '../abi/Bancor.json';
import Web3 from 'web3';
import { IDexHelper } from '../dex-helper';

const BANCOR_NETWORK: { [network: string]: string } = {
  1: '0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0',
};

const BancorRegistry: { [network: string]: string } = {
  1: '0x52ae12abe5d8bd778bd5397f99ca900624cfadd4',
};

export type BancorData = {
  minDestToken: string;
  path: Address[];
  bancorNetwork?: string;
};

type BancorParam = [
  path: Address[],
  srcAmount: string,
  minDestToken: string,
  affiliateAccount: string,
  affiliateFee: string,
];

enum BancorFunctions {
  convert2 = 'convert2',
}

export class Bancor
  extends SimpleExchange
  implements IDexTxBuilder<BancorData, BancorParam>
{
  static dexKeys = ['bancor'];
  exchangeRouterInterface: Interface;

  constructor(dexHelper: IDexHelper) {
    super(dexHelper, 'bancor');
    this.exchangeRouterInterface = new Interface(BancorABI as JsonFragment[]);
  }

  getAdapterParam(
    srcToken: string,
    destToken: string,
    srcAmount: string,
    destAmount: string,
    data: BancorData,
    side: SwapSide,
  ): AdapterExchangeParam {
    if (side === SwapSide.BUY) throw new Error(`Buy not supported`);

    const { path } = data;
    const payload = this.abiCoder.encodeParameter(
      {
        ParentStruct: {
          path: 'address[]',
        },
      },
      { path },
    );

    return {
      targetExchange: BancorRegistry[this.network],
      payload,
      networkFee: '0',
    };
  }

  async getSimpleParam(
    srcToken: string,
    destToken: string,
    srcAmount: string,
    destAmount: string,
    data: BancorData,
    side: SwapSide,
  ): Promise<SimpleExchangeParam> {
    if (side === SwapSide.BUY) throw new Error(`Buy not supported`);

    const defaultArgs = [
      data.path,
      srcAmount,
      data.minDestToken || '1',
      NULL_ADDRESS,
      '0',
    ];
    const swapMethod = BancorFunctions.convert2;
    const swapData = this.exchangeRouterInterface.encodeFunctionData(
      swapMethod,
      defaultArgs,
    );

    return this.buildSimpleParamWithoutWETHConversion(
      srcToken,
      srcAmount,
      destToken,
      destAmount,
      swapData,
      data.bancorNetwork || BANCOR_NETWORK[this.network],
    );
  }

  getDexParam(
    srcToken: Address,
    destToken: Address,
    srcAmount: NumberAsString,
    destAmount: NumberAsString,
    recipient: Address,
    data: BancorData,
    side: SwapSide,
  ): DexExchangeParam {
    if (side === SwapSide.BUY) throw new Error(`Buy not supported`);

    const defaultArgs = [
      data.path,
      srcAmount,
      data.minDestToken || '1',
      NULL_ADDRESS,
      '0',
    ];
    const swapMethod = BancorFunctions.convert2;
    const swapData = this.exchangeRouterInterface.encodeFunctionData(
      swapMethod,
      defaultArgs,
    );

    return {
      needWrapNative: this.needWrapNative,
      dexFuncHasRecipient: false,
      dexFuncHasDestToken: false,
      exchangeData: swapData,
      targetExchange: data.bancorNetwork || BANCOR_NETWORK[this.network],
    };
  }
}
