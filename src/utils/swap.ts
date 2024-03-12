import { Token } from 'everpay'
import WebSocket from 'ws'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { genTokenTag, matchTokenTag, toBN, fromUnitToDecimal, fromDecimalToUnit } = require('everpay/cjs/utils/util')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendRequest } = require('everpay/cjs/api')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hashPersonalMessage = require('everpay/cjs/lib/hashPersonalMessage').default

export const getSwapTokenList = (tokens: Token[], tokenTags: string[], selectedPayToken?: Token): Token[] => {
  let useTags: string[] = tokenTags
  if (selectedPayToken != null) {
    const selectedPayTokenTag = genTokenTag(selectedPayToken)
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    useTags = tokenTags.filter(tag => !matchTokenTag(tag, selectedPayTokenTag))
  }
  return tokens.filter(token => {
    return useTags.find(tag => matchTokenTag(tag, genTokenTag(token))) as string
  })
}

export const getSwapInfo = async (debug?: boolean): Promise<string[]> => {
  const url = `https://${!debug ? 'router.permaswap.network' : 'router-dev.permaswap.network'}/info`
  const result = await sendRequest({
    url,
    method: 'GET'
  })
  return result.data
}

interface GetSwapOrdersParams {
  account: string
  page: number
}

interface GetSwapOrdersResult {
  total: number
  orders: Array<{
    id: number
    address: string
    everHash: string
    tokenInTag: string
    tokenOutTag: string
    tokenInAmount: string
    tokenOutAmount: string
    price: string
    status: string
  }>
}

export const getSwapOrders = async (debug: boolean, params: GetSwapOrdersParams): Promise<GetSwapOrdersResult> => {
  const { account, page } = params
  const url = `https://${!debug ? 'router.permaswap.network' : 'router-dev.permaswap.network'}/orders/${account}?page=${page}`
  const result = await sendRequest({
    url,
    method: 'GET'
  })
  return result.data
}

interface SendQueryParams {
  tokenIn: Token
  tokenOut: Token
  tokenInAmount: string
  address?: string
}

export interface InitSocketParams {
  handleError: any
  handleOrder: any
  handleSubmit: any
  handleOpen: any
}
export const initSocket = (debug: boolean, params: InitSocketParams): any => {
  const socket = new WebSocket(`wss://${!debug ? 'router.permaswap.network' : 'router-dev.permaswap.network'}/wsuser`)
  socket.addEventListener('message', (message: any) => {
    const data = JSON.parse(message.data)
    if (data.event === 'order') {
      params.handleOrder(data)
    } else if (data.event === 'error') {
      params.handleError(data)
    } else if (data.event === 'status') {
      params.handleSubmit(data)
    }
  })
  socket.addEventListener('open', params.handleOpen)
  return socket
}

export const sendQuery = (socket: any, params: SendQueryParams): void => {
  const { tokenIn, tokenOut, tokenInAmount, address } = params
  const data = {
    event: 'query',
    tokenIn: tokenIn.tag,
    tokenOut: tokenOut.tag,
    amountIn: fromUnitToDecimal(tokenInAmount, tokenIn.decimals),
    address: address !== '' ? address : `0x${'0'.repeat(40)}`
  }
  socket.send(JSON.stringify(data))
}

interface SendSubmitParams {
  address: string
  bundle: any
  tokenIn: string
  tokenOut: string
  paths: any
}

export const sendSubmit = (socket: any, params: SendSubmitParams): void => {
  const { address, bundle, paths, tokenIn, tokenOut } = params
  const data = {
    event: 'submit',
    address,
    tokenIn,
    tokenOut,
    bundle,
    paths
  }
  socket.send(JSON.stringify(data))
}

export const getReceiveAmountFromBundle = (bundle: any, receiveToken: Token): string => {
  let decimalAmount = toBN(0)
  bundle.items.forEach((item: any) => {
    if (item.tag === receiveToken.tag) {
      decimalAmount = decimalAmount.plus(item.amount)
    }
  })
  return fromDecimalToUnit(decimalAmount, receiveToken.decimals)
}

// 获取小数部分开始 0 的个数
const getFractionalPart0Counts = (fractionalPart: string): number => {
  for (let i = 0; i < fractionalPart.length; i += 1) {
    if (fractionalPart[i] !== '0') {
      return i
    }
  }
  return fractionalPart.length
}

export const formatRate = (rate: string, numberCounts: number): string => {
  const [integerPart, fractionalPart] = rate.split('.')
  if (integerPart.length >= numberCounts) {
    return integerPart
  }
  if (fractionalPart?.length > 0) {
    const needReduceCounts = +integerPart === 0
      // 整数部分是 0，补足小数部分不是 0 前缀的数量
      ? -getFractionalPart0Counts(fractionalPart)
      : integerPart.length
    const fractionalPartUpdated = fractionalPart.slice(0, numberCounts - needReduceCounts)
    return `${integerPart}.${fractionalPartUpdated}`
  }
  return rate
}

const uint8ArrayToHex = (uint8Array: Uint8Array): string => {
  return '0x' + [...uint8Array].map((b) => {
    return b.toString(16).padStart(2, '0')
  }).join('')
}

export const getOrderHash = (bundle: any): string => {
  const orderHash = uint8ArrayToHex(hashPersonalMessage(Buffer.from(JSON.stringify(bundle))))
  return orderHash
}
