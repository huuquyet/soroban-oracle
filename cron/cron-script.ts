import {
  Address,
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  type xdr,
} from '@stellar/stellar-sdk'
import cron from 'node-cron'
import config from './config.json' assert { type: 'json' }

const { oracle_id, admin_secret } = config
const API_NINJA_KEY = 'YOUR_API_KEY'

const sourceKeypair = Keypair.fromSecret(admin_secret)
const sourcePublicKey = sourceKeypair.publicKey()

const contract = new Contract(oracle_id)

const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org', { allowHttp: true })

const networkPassphrase = Networks.TESTNET
const fee = '100'

const getTimestamp = async () => {
  const account = await server.getAccount(sourcePublicKey)
  try {
    const transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(contract.call('get_timestamp'))
      .setTimeout(30)
      .build()

    const resultSimulation = await server.simulateTransaction(transaction)
    if (!SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      throw new Error(`[ERROR] [getTimestamp]: ${JSON.stringify(resultSimulation)}`)
    }
    return scValToNative(resultSimulation.result?.retval as xdr.ScVal)
  } catch (e) {
    console.error(e)
    throw new Error('[getTimestamp] ERROR')
  }
}

const getPairInfo = async () => {
  const account = await server.getAccount(sourcePublicKey)
  try {
    const transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(contract.call('get_pair_info'))
      .setTimeout(30)
      .build()

    const resultSimulation = await server.simulateTransaction(transaction)
    if (!SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      throw new Error(`[ERROR] [getPairInfo]: ${JSON.stringify(resultSimulation)}`)
    }
    return scValToNative(resultSimulation.result?.retval as xdr.ScVal)
  } catch (e) {
    console.error(e)
    throw new Error('[getPairInfo] ERROR')
  }
}

const getEpochData = async (epoch: any) => {
  const account = await server.getAccount(sourcePublicKey)
  try {
    const epochNr = nativeToScVal(epoch, { type: 'u32' })

    const transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(contract.call('get_pair_data_at_epoch', ...[epochNr]))
      .setTimeout(30)
      .build()

    const resultSimulation = await server.simulateTransaction(transaction)
    if (!SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      throw new Error(`[ERROR] [const getEpochData = async (epochNr) => {
        ]: ${JSON.stringify(resultSimulation)}`)
    }
    return scValToNative(resultSimulation.result?.retval as xdr.ScVal)
  } catch (e) {
    console.error(e)
    throw new Error('[getEpochData] ERROR')
  }
}

const getPairPrice = async (pairName: any) => {
  try {
    // const response = await fetch(`https://api.api-ninjas.com/v1/cryptoprice?symbol=${pairName}`, {
    //   headers: {
    //     'X-Api-Key': API_NINJA_KEY,
    //   },
    // })
    const response = await fetch('https://blockchain.info/ticker').then((res) => res.json())
    const result = response.USD.last
    return Number.parseInt(String(Number.parseFloat(result) * 10 ** 5))
  } catch (e) {
    console.error(e)
    throw new Error('[getPairPrice] ERROR')
  }
}

const updatePairPrice = async (price: any) => {
  try {
    const account = await server.getAccount(sourcePublicKey)
    const value = nativeToScVal(price, { type: 'u64' })
    const caller = new Address(account.accountId()).toScVal()

    const operation = contract.call('set_epoch_data', ...[caller, value])
    let transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build()

    transaction = await server.prepareTransaction(transaction)
    transaction.sign(sourceKeypair)
    const response = await server.sendTransaction(transaction)
    const resultSimulation = await server.simulateTransaction(transaction)
    console.log(
      '[updatePairPrice] Transaction hash:',
      `https://testnet.steexp.com/${response.hash}`
    )

    const hash = response.hash
    if (response.status === 'ERROR') {
      console.log('[updatePairPrice] ERROR STATUS')
      throw new Error('[updatePairPrice] ERROR STATUS')
    }

    while (response.status !== 'PENDING') {
      const response = await server.getTransaction(hash)
      console.log('[updatePairPrice] response.status: ', response.status)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }

    if (SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      console.log('[updatePairPrice] SUCCESS')
      console.log('[updatePairPrice] Transaction status:', response.status)
    } else {
      console.log('[updatePairPrice] ERROR ')
      throw new Error('[updatePairPrice] ERROR ')
    }
  } catch (e) {
    console.error(e)
    throw new Error('[updatePairPrice] ERROR')
  }
}

const main = async () => {
  try {
    const pairInfo = await getPairInfo()
    const epochInterval = Number.parseInt(pairInfo.epoch_interval)
    const currentTimestamp = await getTimestamp()
    const lastEpochNr = pairInfo.last_epoch
    console.log('lastEpochNr ', lastEpochNr)

    let lastEpochTimestamp = 0
    if (lastEpochNr > 0) {
      const lastEpochData = await getEpochData(lastEpochNr)
      lastEpochTimestamp = Number.parseInt(lastEpochData.time)

      const lastEpochPrice = Number.parseInt(lastEpochData.value)
      console.log('lastEpochPrice ', lastEpochPrice)
    }

    const deltaTimestamp = Number(currentTimestamp) - lastEpochTimestamp
    console.log('deltaTimestamp ', deltaTimestamp)
    if (deltaTimestamp >= epochInterval) {
      console.log('Need to update the value')
    } else {
      console.log("Don't need to update the value")
      return
    }

    const priceData = await getPairPrice('BTCUSDT')
    console.log('fetched priceData ', priceData)

    const updatePairPriceResult = await updatePairPrice(priceData)
    console.log('value set!')
  } catch (e) {
    console.log('ERROR')
    console.error(e)
  }
}

cron.schedule('*/15 * * * *', async () => {
  console.log('Running a task every 15 minutes')
  console.log('Current Time: ', new Date())
  await main()
})
