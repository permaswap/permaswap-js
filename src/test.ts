import Permaswap from './'
import { ethers } from 'ethers'
import Everpay from 'everpay'

const ethWalletHasUSDT = {
  address: '0x26361130d5d6E798E9319114643AF8c868412859',
  privateKey: '94c97d4cc865d77afaf2d64147f7c067890e1485eb5d8e2c15cc0b7528a08b47'
}

const provider = new ethers.providers.InfuraProvider('goerli')
const signer = new ethers.Wallet(ethWalletHasUSDT.privateKey, provider)
const everpay = new Everpay({
  debug: true,
  account: ethWalletHasUSDT.address,
  ethConnectedSigner: signer
})

const permaswap = new Permaswap({
  debug: true,
  account: ethWalletHasUSDT.address,
  everpay
})

const run = async (): Promise<void> => {
  const everpayInfo = await everpay.info()
  const tusdcTokenTag = everpayInfo.tokenList.find(t => t.symbol.toUpperCase() === 'TUSDC')?.tag as string
  const tarTokenTag = everpayInfo.tokenList.find(t => t.symbol.toUpperCase() === 'TAR')?.tag as string

  console.log('tusdcTokenTag', tusdcTokenTag)
  console.log('tarTokenTag', tarTokenTag)

  await permaswap.subscribe({
    payTokenAmount: '0.01',
    payTokenTag: tusdcTokenTag,
    receiveTokenTag: tarTokenTag
  // eslint-disable-next-line node/handle-callback-err
  }, async (err: any, order: any) => {
    if (order != null) {
      const { tokenIn, tokenOut, bundle, paths } = order
      console.log(order)
      await permaswap.trade(
        tokenIn,
        tokenOut,
        bundle,
        paths,
        (data: any) => {
          console.log('handleSubmit', data)
        })
    }
  })
}

permaswap.init(run)
