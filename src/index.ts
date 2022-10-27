import Everpay, { Token } from 'everpay'
import { initSocket, sendQuery, formatRate, getReceiveAmountFromBundle, sendSubmit, getOrderHash } from './utils/swap'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getTokenBySymbol, toBN } = require('everpay/cjs/utils/util')

interface SubscribeParams {
  paySymbol: string
  receiveSymbol: string
  payAmount: string
}

interface Config {
  debug: boolean
  account: string
  everpay: Everpay
}

export default class Permaswap {
  constructor (config: Config) {
    const { debug, account, everpay } = config
    this._debug = debug
    this._account = account
    this.everpay = everpay
  }

  _debug: boolean
  _account: string
  everpay: Everpay
  socket: any
  subscribeHandler: any
  tradeHandler: any

  init (callback: any): void {
    this.socket = initSocket(this._debug, {
      handleOrder: (order: any) => {
        this.subscribeHandler(null, order)
      },
      handleError: (err: any) => {
        this.subscribeHandler(err, null)
      },
      handleSubmit: (data: any) => {
        this.tradeHandler(data)
      },
      handleOpen: callback
    })
  }

  async subscribe (params: SubscribeParams, subscribeHandler: any): Promise<void> {
    const everpayInfo = await this.everpay.info()
    const { payAmount, paySymbol, receiveSymbol } = params
    const payToken = getTokenBySymbol(paySymbol, everpayInfo.tokenList)
    const receiveToken = getTokenBySymbol(receiveSymbol, everpayInfo.tokenList)
    this.subscribeHandler = (err: any, data: any) => {
      if (err != null) {
        subscribeHandler(err, data)
      } else {
        data.rate = formatRate(toBN(1).dividedBy(data.price).toString(), 8)
        data.receiveAmount = getReceiveAmountFromBundle(data.bundle, receiveToken)
        data.orderHash = getOrderHash(data.bundle)
        subscribeHandler(err, data)
      }
    }
    sendQuery(this.socket, {
      tokenIn: payToken as Token,
      tokenOut: receiveToken as Token,
      tokenInAmount: payAmount as any,
      address: this._account
    })
  }

  async trade (tokenIn: string, tokenOut: string, bundle: any, paths: any, tradeHandler: any): Promise<void> {
    const bundleDataWithSigs = await this.everpay.signBundleData(bundle)
    this.tradeHandler = tradeHandler
    sendSubmit(this.socket, {
      tokenIn,
      tokenOut,
      address: this._account,
      bundle: bundleDataWithSigs,
      paths
    })
  }

  close (): void {
    if (this.socket != null) {
      this.socket.close()
    }
  }
}
