#!/bin/bash

set -e

NETWORK=$1

SOROBAN_RPC_HOST=$2

PATH=./target/bin:$PATH

# USER="YOUR_PUBLIC_KEY" # your freighter public key

if [[ -d "./.soroban/contracts" ]]; then
  echo "Found existing '.soroban/contracts' directory; already initialized."
  exit 0
fi

if [[ -d "./target/bin" ]]; then
  echo "Using soroban binary from ./target/bin"
elif command -v soroban &> /dev/null; then
  echo "Using soroban cli"
else
  echo "Soroban not found, install soroban cli"
  cargo install_soroban
fi

if ! command -v jq &> /dev/null; then
  echo "Install jq to get price"
  sudo apt install jq bc -y
fi

if [[ $SOROBAN_RPC_HOST != "" ]]; then
  SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
if [[ $NETWORK == "futurenet" ]]; then
  SOROBAN_RPC_URL="https://rpc-futurenet.stellar.org"
elif [[ "$NETWORK" == "testnet" ]]; then
  SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
else
    # assumes standalone on quickstart, which has the soroban/rpc path
  SOROBAN_RPC_URL="http://localhost:8000/soroban/rpc"
fi

case "$NETWORK" in
futurenet)
  echo "Using Futurenet network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  ;;
testnet)
  echo "Using Testnet network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
  ;;
standalone)
  echo "Using standalone network with RPC URL: $SOROBAN_RPC_URL"
  SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  ;;
*)
  echo "Usage: $0 standalone|futurenet|testnet [rpc-host]"
  exit 1
  ;;
esac

echo "Add the $NETWORK network to cli client"
soroban network add \
  --rpc-url $SOROBAN_RPC_URL \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" $NETWORK

echo "Add $NETWORK to shared config"
echo "{ \"network\": \"$NETWORK\", \"rpcUrl\": \"$SOROBAN_RPC_URL\", \"networkPassphrase\": \"$SOROBAN_NETWORK_PASSPHRASE\" }" > ./src/shared/config.json

if !(soroban keys ls | grep token-admin 2>&1 >/dev/null); then
  echo "Create the token-admin identity"
  soroban keys generate token-admin --network $NETWORK
fi
ADMIN_ADDRESS="$(soroban keys address token-admin)"

# This will fail if the account already exists, but it'll still be fine.
echo "Fund token-admin & user account from friendbot"
soroban keys fund token-admin --network $NETWORK
# soroban keys fund $USER --network $NETWORK

ARGS="--network $NETWORK --source token-admin"

WASM_PATH="./target/wasm32-unknown-unknown/release/"
TOKEN_PATH=$WASM_PATH"soroban_token_contract"
DONATION_PATH=$WASM_PATH"soroban_donation_contract"
ORACLE_PATH=$WASM_PATH"soroban_oracle_contract"

# Compiles the smart contracts and stores WASM files in ./target/wasm32-unknown-unknown/release
echo "Build contracts"
soroban contract build
echo "Optimizing contracts"
soroban contract optimize --wasm $TOKEN_PATH".wasm"
soroban contract optimize --wasm $DONATION_PATH".wasm"
soroban contract optimize --wasm $ORACLE_PATH".wasm"

# Deploys the contracts and stores the contract IDs in .soroban

# The BTC Token contract is a Soroban token that represents BTC/USD
echo "Deploy the BTC TOKEN contract"
BTC_TOKEN_ID="$(
  soroban contract deploy $ARGS \
    --wasm $TOKEN_PATH".optimized.wasm"
)"
echo "Contract deployed succesfully with ID: $BTC_TOKEN_ID"

# The donation contract is a Soroban contract that allows users to donate to a specific address
echo "Deploy the DONATION contract"
DONATION_ID="$(
  soroban contract deploy $ARGS \
    --wasm $DONATION_PATH".optimized.wasm"
)"
echo "Contract deployed succesfully with ID: $DONATION_ID"

# The oracle contract is responsible for calculating the price of BTC/USD
echo "Deploy the ORACLE contract"
ORACLE_ID="$(
  soroban contract deploy $ARGS \
    --wasm $ORACLE_PATH".optimized.wasm"
)"
echo "Contract deployed succesfully with ID: $ORACLE_ID"

# Initialize the contracts
echo "Initialize the BTC TOKEN contract"
soroban contract invoke \
  $ARGS \
  --id $BTC_TOKEN_ID \
  -- \
  initialize \
  --symbol BTC \
  --decimal 8 \
  --name Bitcoin \
  --admin token-admin

# Recipient is the only account that can withdraw BTC from the donation contract
# Cannot make donations
echo "Initialize the DONATION contract"
soroban contract invoke \
  $ARGS \
  --id $DONATION_ID \
  -- \
  initialize \
  --recipient token-admin \
  --token $BTC_TOKEN_ID

# Relayer is the account that will be used to relay transactions to the oracle contract
echo "Initialize the ORACLE contract"
soroban contract invoke \
  $ARGS \
  --id $ORACLE_ID \
  -- \
  initialize \
  --caller token-admin \
  --pair_name BTC_USDT \
  --epoch_interval 600 \
  --relayer token-admin

# Call set_epoch_data to set price for BTC_USDT
echo "Initialize BTC_USDT price"
PRICE_STRING="$(curl -s https://blockchain.info/ticker | jq -r '.USD.last')"
BTC_PRICE=$( echo "$PRICE_STRING * 10 ^ 5 / 1" | bc )
soroban contract invoke \
  $ARGS \
  --id $ORACLE_ID \
  -- \
  set_epoch_data \
  --caller token-admin \
  --value $BTC_PRICE

echo "Generate bindings contracts"
soroban contract bindings typescript \
  --network $NETWORK \
  --id $BTC_TOKEN_ID \
  --wasm $TOKEN_PATH".optimized.wasm" \
  --output-dir ./.soroban/contracts/token \
  --overwrite
soroban contract bindings typescript \
  --network $NETWORK \
  --id $DONATION_ID \
  --wasm $DONATION_PATH".optimized.wasm" \
  --output-dir ./.soroban/contracts/donation \
  --overwrite
soroban contract bindings typescript \
  --network $NETWORK \
  --id $ORACLE_ID \
  --wasm $ORACLE_PATH".optimized.wasm" \
  --output-dir ./.soroban/contracts/oracle \
  --overwrite

echo "Done"
