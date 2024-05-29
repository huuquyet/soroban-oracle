import { SorobanRpc } from '@stellar/stellar-sdk'
import * as Donation from 'donation-contract'
import * as Oracle from 'oracle-contract'
import * as Token from 'token-contract'
import config from './config.json'

const { network, rpcUrl } = config

export const btc = new Token.Client({
  rpcUrl,
  ...Token.networks[network as keyof typeof Token.networks],
})

export const donation = new Donation.Client({
  rpcUrl,
  ...Donation.networks[network as keyof typeof Donation.networks],
})

export const oracle = new Oracle.Client({
  rpcUrl,
  ...Oracle.networks[network as keyof typeof Oracle.networks],
})

export const server = new SorobanRpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http:') })
