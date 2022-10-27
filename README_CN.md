# permaswap-js

## Installation

### Using yarn

```
yarn add permaswap
```

### Using npm

```
npm install permaswap
```

## Configuration

| params | Description  |
|-------------|---|
|debug|Used for development and production environment selection|
|account| everPay account string |
|everpay|Everpay instance, please flow [everpay-js docs](https://docs.everpay.io/en/docs/sdk/everpay-js/intro)|

### Example

```ts
import Permaswap from 'permaswap'
import { ethers } from 'ethers'
import Everpay from 'everpay'

const wallet = {
  address: '0x26361130d5d6E798E9319114643AF8c868412859',
  privateKey: '94c97d4cc865d77afaf2d64147f7c067890e1485eb5d8e2c15cc0b7528a08b47'
}

const provider = new ethers.providers.InfuraProvider('kovan')
const signer = new ethers.Wallet(wallet.privateKey, provider)
const everpay = new Everpay({
  debug: true,
  account: wallet.address,
  ethConnectedSigner: signer
})

const permaswap = new Permaswap({
  debug: true,
  account: wallet.address,
  everpay
})
```

## Methods

### permaswap.init(callback)

与 Permaswap Router 建立 websocket 连接，callback 会在连接建立后执行。

### permaswap.subscribe({ payAmount, paySymbol, receiveSymbol }, subscribeHandler)

通过 `paySymbol`, `receiveSymbol`, `payAmount` 订阅 `order`。`order` 会源源不断推送给 `subscribeHandler` 函数。

subscribeHandler 函数，接受两个参数，`error` 和 `order`

`order` 包含字段示例

```js
{
  event: 'order',
  userAddr: '0x26361130d5d6E798E9319114643AF8c868412859',
  tokenIn: 'ethereum-eth-0x0000000000000000000000000000000000000000',
  tokenOut: 'ethereum-usdt-0xd85476c906b5301e8e9eb58d174a6f96b9dfc5ee',
  price: '0.0003053731',
  priceImpact: '0.0039111582',
  bundle: {
    items: [
      //...
    ],
    expiration: 1666855442,
    salt: '2076d49c-7d53-44db-a664-3b4dcc33e46c',
    version: 'v1'
  },
  paths: [
    //...
  ],
  rate: '3274.6826',
  receiveAmount: '32.746822',
  orderHash: '0x6985580ad60114fcdeabda7455cf43bcb3a5db0a4a80db33a1816ab1718f442a'
}
```

其中，`rate` 和 `receiveAmount` 可用于开发者判断该笔订单是否值得成交。

`orderHash` 是该 `order` 唯一标识符。

### permaswap.trade(tokenIn, tokenOut, bundle, paths, tradeHandler)

`tokenIn`, `tokenOut`, `bundle`, `paths` 均来自 `order`。`traderHandler` 函数接受一个参数如下示例：

```js
{
  event: 'status',
  orderHash: '0xb9586b38e624dd31654f3449f16ad23095ae7b6ce16c8abe2955f1028c85b101',
  everHash: '0x6153cac909ef7ba329412015985e68ab1e405f51934184d86b283953598d2971',
  status: 'success'
}
```

当 `status` 为 `'success'` 时，代表该笔订单交易成功。

### permaswap.close()

关闭 permaswap 与 router 的 websocket 连接。

## 其他

更多示例见 [test.ts](https://github.com/permaswap/permaswap-js/blob/main/src/test.ts)
