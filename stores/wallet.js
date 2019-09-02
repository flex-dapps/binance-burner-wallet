/**
 * This is the main "state store" of the application. It attempts to contain
 * everything which is relevant to the act of actually dealing with sending
 * monies. "Monies" in this instance is the ERC223 token deployed for usage
 * with this instance of the burner wallet. Any code relating to interacting
 * with that token contract should be contained within this file.
 *
 * Any other contract interactions should be moved to a file which is specific
 * to them, under the /dapps/ folder.
 */

module.exports = store

const axios = require('axios');

import { sendTokenTx, getTokenBalance, getEthbalance, getTokenContract } from './eth/utils'
import { getWallet, getBalance } from './bnb/utils'

const DEFAULT_STATE = {
  qr: null,
  bnbBalance: Number(-1), 
  tokenContract: null,
  tokenBalance: 0,
  address: '0x0000000000000000000000000000000000000000',
  burner: {
    signingKey: {
      privateKey: '0x0000000000000000000000000000000000000000'
    }
  },
  nextTx: {
    beforeParams: `You're sending`,
    price: -1,
    joiningStatement: '',
    param: '',
    afterParams: ``,
    cta: `Swipe to confirm`
  },
  afterConfirm: () => {},
  afterSend: () => {}, // allow specification of a callback after send
  refreshFuncs: [] // allow addition of functions which "refresh" the app
}

async function store(state, emitter) {
  state.wallet = Object.assign({}, DEFAULT_STATE)
  let wallet = state.wallet // convenience
  
  // creates a wallet if there is not already one in localstorage
  wallet.burner = getWallet(state.client)
  wallet.address = JSON.parse(wallet.burner).address // for convenience

  // getBalance
  wallet.tokenBalance = await getBalance(state.client, wallet.address, "BNB")

  emitter.emit('render')

  console.log('bnbClient', state.client)

  // this is where you would stick some code that filled the user's wallet with
  // xDAI or whatever, if you were going to do it that way
  // getSomeGas()

  // set this such that other parts of our application can refresh the wallet UI
  // wallet.refresh = () => {
  //   for (let refreshFunc of wallet.refreshFuncs) {
  //     refreshFunc()
  //   }
  // }

  // grab a contract instance attached to our burner wallets
  // wallet.tokenContract = getTokenContract(
  //   state.TOKEN_ADDRESS,s
  //   abi,
  //   state.provider,
  //   wallet.burner
  // )

  // set up an event listener and notifications for the transfer function
  // setupTransferNotifications(wallet, state)

  // setTokenBalance()

  // a whole bunch of events for you to configure the 'confirm' screen in the
  // wallet. YOU DON'T HAVE TO USE THE CONFIRM SCREEN, this is just a handy
  // little set of helpers if you do
  // for an example of how this looks, set play around with the /vip dapp
  // will probably rip this out as i don't think the confirm dialog should be a
  // default part of the application, dapps can create one if they like
  emitter.on('nextTx.setBeforeParams', s => (wallet.nextTx.beforeParams = s))
  emitter.on('nextTx.setPrice', s => (wallet.nextTx.price = s))
  emitter.on(
    'nextTx.setJoiningStatement',
    s => (wallet.nextTx.joiningStatement = s)
  )
  emitter.on('nextTx.setParam', s => (wallet.nextTx.param = s))
  emitter.on('nextTx.setAfterParams', s => (wallet.nextTx.afterParams = s))
  emitter.on('nextTx.setCta', s => (wallet.nextTx.cta = s))
  emitter.on('nextTx.confirm', () => wallet.afterConfirm())
  emitter.on('nextTx.sent', () => wallet.afterSend())

  // send the wallet's tokens (this is hardcoded to an ERC223 at the moment)
  // @todo add a function param so that methods other than tokenFallback can be
  // called on the receiving contracts
  emitter.on(
    'wallet.sendTokens',
    async (to, value, bytes = '0x', messages, error) => {
      // handle not enough cash here
      if (value > wallet.tokenBalance) {
        state.assist.notify('error', `Balance too low`)
        if (error && typeof error === 'function') error()
        return     }
      // sendTokenTransaction(wallet.address, "tbnb1un950smk6nzke56pfjmz4kc7j9ceuyutjv908p", value, "BNB", "testy test")
      sendTokenTransaction(wallet.address, to, value, "BNB", "outgoing tx")
      emitter.emit('nextTx.sent')
    }
  )

  wallet.refreshFuncs.push(getBalance)

  emitter.on('wallet.addRefreshFunc', f => {
    wallet.refreshFuncs.push(f)
  })

  // function which gets the balance of the user in a token then renders an update
  // async function setTokenBalance() {
  //   try {
  //       wallet.tokenBalance = await getTokenBalance(
  //       wallet.tokenContract,
  //       wallet.address
  //     )
  //     emitter.emit('render')
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  // sends a token transaction (currently hardcoded to a single wallet token)
  // uses the standard token tx messages unless you pass in something as messages

  // async function sendTokenTransaction(to, value, bytes = '0x', messages = {}) {
  //   const txMessages = Object.assign(getDefaultTokenMessages(value), messages)
  //   const dismiss = state.assist.notify('pending', txMessages.txSent(), -1)
  //   const c = state.wallet.tokenContract.connect(wallet.burner) // this file
  //   const nonce = await state.provider.getTransactionCount(wallet.address) //this file
  //   // sendTokenTx(to, value, bytes, c, nonce);
  //   sendTokenTx(to, value, bytes, c, nonce)
  // }

async function sendTokenTransaction(addrFrom, addrTo, value, asset, message){


  const httpClient = axios.create({ baseURL: state.JSON_RPC_URL });
  const sequenceURL = `${state.JSON_RPC_URL}api/v1/account/${addrFrom}/sequence`;

  // console.log('stuff', httpClient)

  // httpClient
  //   .get(sequenceURL)
  //   .then((res) => {
  //       // const sequence = res.data.sequence || 0
  //       const sequence = 0
  //       return state.client.transfer(addrFrom, addrTo, value, asset, message, sequence)
  //   })
  //   .then((result) => {
  //           console.log(result);
  //       if (result.status === 200) {
  //           console.log('success', result.result[0].hash);
  //       } else {
  //           console.error('error', result);
  //       }
  //   })
  //   .catch((error) => {
  //       console.error('error', error);
  //   });
  
  const blah = state.client.transfer("tbnb1u5kztk9qapu3y4vh7jflwgquakvj48f2guht9y", addrTo, value, asset).then((res) => console.log('res', res))
  
  console.log('blah', addrFrom)
  // console.log('here')
    // .then((result) => {
    //     console.log('result', result);
    //     if (result.status === 200) {
    //         console.log('success', result.result[0].hash);
    //     } else {
    //         console.error('error', result);
    //     }
    // })
    // .catch((error) => {
    //     console.error('error', error);
    // });
}

  // ------------------ NOTIFICATION STUFF ------------------------

  // gets the default token sending messages (should allow tokens to set a
  // symbol or something like that)
  function getDefaultTokenMessages(value) {
    return {
      txSent: () =>
        `Sending ${state.CURRENCY_SYMBOL}${Number(value).toLocaleString()}`,
      txConfirmed: () =>
        `Sent ${state.CURRENCY_SYMBOL}${Number(value).toLocaleString()}`,
      txStall: () => `Something's wrong...`,
      txConfirmed: () =>
        `Sent ${state.CURRENCY_SYMBOL}${Number(value).toLocaleString()}`
    }
  }

  function setupTransferNotifications(
    { tokenContract, address, refresh },
    state // we can't pull assist off state because it's not initialised yet
  ) {
    tokenContract.on(tokenContract.filters.Transfer(null, null), (f, t, v) => {
      if (t.toLowerCase() === address.toLowerCase()) {
        state.assist.notify(
          'success',
          `Received ${state.CURRENCY_SYMBOL}${v.toNumber().toLocaleString()}!`
        )
      } else if (f.toLowerCase() === address.toLowerCase()) {
        // we were the person who sent the money but we get this notification
        // already from the send function
        // state.assist.notify('success', `Sent ${state.CURRENCY_SYMBOL}${v.toNumber().toLocaleString()}!`)
      }
      refresh()
    })
  }

  // ----------- MOVED FUNCTIONS (now live in stores/eth/utils) ----------------

  // async function getEthbalance() {
  //   wallet.ethBalance = ethers.utils.formatEther(
  //     await state.provider.getBalance(wallet.address)
  //   )
  // }

  // function getTokenContract(address, abi, provider, burner) {
  //   const c = new ethers.Contract(address, abi, provider)
  //   // connect our burner account with the contract so we can send txs
  //   return c.connect(burner)
  // }
  
  // gets the balance of a given user on a given token contract
  // async function getTokenBalance(contract, address) {
  //   try {
  //     const b = await contract.balanceOf(address)
  //     return b.toNumber()
  //   } catch (e) {
  //     return -1
  //   }
  // }

  // gets the burner wallet from localstorage or else creates a new one
  // function getWallet(provider) {
  //   let w = localStorage.getItem('wallet')
  //   if (w) {
  //     w = new ethers.Wallet(JSON.parse(w).signingKey.privateKey, provider)
  //   } else {
  //     w = ethers.Wallet.createRandom()
  //     localStorage.setItem('wallet', JSON.stringify(w))
  //     w = w.connect(provider)
  //   }
  //   return w
  // }
}
