# permaswap-js

**Please upgrade to version 0.1.0 or later**

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

const provider = new ethers.providers.InfuraProvider('goerli')
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

Establish a websocket connection with Permaswap Router, callback will be executed after the connection is established.

### permaswap.subscribe({ payTokenAmount, payTokenTag, receiveTokenTag }, subscribeHandler)

**payTokenTag** and **receiveTokenTag** represent the paid token tag and the received token tag, and the unique token `tag` corresponding to the token `symbol` is available via `everpay.info()`.

Subscribe to `order` via `payTokenTag`, `receiveTokenTag`, `payTokenAmount`. The `order` is pushed to the `subscribeHandler` function.

subscribeHandler function, which takes two parameters, `error` and `order`.

`order` contains field examples

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
  receiveTokenAmount: '32.746822',
  orderHash: '0x6985580ad60114fcdeabda7455cf43bcb3a5db0a4a80db33a1816ab1718f442a'
}
```

Where `rate` and `receiveTokenAmount` can be used by the developer to determine if the order is worthy of being filled.

`orderHash` is the unique identifier for the `order`.

### permaswap.trade(tokenIn, tokenOut, bundle, paths, tradeHandler)

`tokenIn`, `tokenOut`, `bundle`, `paths` are all from `order`. The `traderHandler` function accepts one argument as the following example.

```js
{
  event: 'status',
  orderHash: '0xb9586b38e624dd31654f3449f16ad23095ae7b6ce16c8abe2955f1028c85b101',
  everHash: '0x6153cac909ef7ba329412015985e68ab1e405f51934184d86b283953598d2971',
  status: 'success'
}
```

When `status` is `'success'`, it means the order was successful.

### permaswap.close()

Close the websocket connection between permaswap and router.

## Other

For more examples see [test.ts](https://github.com/permaswap/permaswap-js/blob/main/src/test.ts)
