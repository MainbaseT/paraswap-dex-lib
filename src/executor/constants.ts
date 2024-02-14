import { ethers } from 'ethers';

const {
  utils: { hexlify, hexZeroPad },
} = ethers;

export const BYTES_28_LENGTH = 28;
export const BYTES_64_LENGTH = 64;
export const BYTES_96_LENGTH = 96;

export const ZEROS_4_BYTES = hexZeroPad(hexlify(0), 4);
export const ZEROS_12_BYTES = hexZeroPad(hexlify(0), 12);
export const ZEROS_28_BYTES = hexZeroPad(hexlify(0), 28);
export const ZEROS_32_BYTES = hexZeroPad(hexlify(0), 32);

export const SWAP_EXCHANGE_100_PERCENTAGE = 100;

export const EXECUTOR_01_02_FUNCTION_CALL_DATA_TYPES: string[] = [
  'bytes20', // address
  'bytes4', // calldata Size
  'bytes2', // fromAmount Pos
  'bytes2', // srcTokenPos
  'bytes1', // returnAmount Pos
  'bytes1', // specialExchange
  'bytes2', // flag
  'bytes28', // zero padding
  'bytes', // dex calldata
];

export const EXECUTOR_03_FUNCTION_CALL_DATA_TYPES: string[] = [
  'bytes20', // address(bytes20)
  'bytes2', // calldata Size(bytes 2)
  'bytes2', // toAmount Pos(bytes2)
  'bytes2', // fromAmount Pos(bytes2)
  'bytes2', // srcTokenPos(bytes2)
  'bytes2', // specialExchange (bytes2)
  'bytes2', // flag(bytes2)
  'bytes28', // zero padding (bytes28)
  'bytes', // dex calldata (bytes)
];

export const APPROVE_CALLDATA_DEST_TOKEN_POS = 68;
export const WRAP_UNWRAP_FROM_AMOUNT_POS = 4;
