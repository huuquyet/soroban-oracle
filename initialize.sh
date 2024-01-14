#!/bin/bash

set -e

NETWORK="$1"

SOROBAN_RPC_HOST="$2"

PATH=./target/bin:$PATH

if [[ -f "./.soroban-example-dapp/crowdfund_id" ]]; then
  echo "Found existing './.soroban-example-dapp' directory; already initialized."
  exit 0
fi

if [[ -f "./target/bin/soroban" ]]; then
  echo "Using soroban binary from ./target/bin"
elif command -v soroban &> /dev/null; then
  echo "Using soroban cli"
else
  echo "Soroban not found, install soroban cli"
  cargo install_soroban
fi

if [[ "$SOROBAN_RPC_HOST" == "" ]]; then
  if [[ "$NETWORK" == "futurenet" ]]; then
    SOROBAN_RPC_HOST="https://rpc-futurenet.stellar.org"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
  else
     # assumes standalone on quickstart, which has the soroban/rpc path
    SOROBAN_RPC_HOST="http://localhost:8000"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
  fi
else 
  SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"  
fi

case "$1" in
standalone)
  SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  FRIENDBOT_URL="$SOROBAN_RPC_HOST/friendbot"
  ;;
futurenet)
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  FRIENDBOT_URL="https://friendbot-futurenet.stellar.org/"
  ;;
*)
  echo "Usage: $0 standalone|futurenet [rpc-host]"
  exit 1
  ;;
esac

echo "Using $NETWORK network"
echo "  RPC URL: $SOROBAN_RPC_URL"
echo "  Friendbot URL: $FRIENDBOT_URL"

echo Add the $NETWORK network to cli client
soroban config network add \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" "$NETWORK"

echo "Add $NETWORK to .soroban-example-dapp for use with npm scripts"
mkdir -p .soroban-example-dapp
echo $NETWORK > ./.soroban-example-dapp/network
echo $SOROBAN_RPC_URL > ./.soroban-example-dapp/rpc-url
echo "$SOROBAN_NETWORK_PASSPHRASE" > ./.soroban-example-dapp/passphrase
echo "{ \"network\": \"$NETWORK\", \"rpcUrl\": \"$SOROBAN_RPC_URL\", \"networkPassphrase\": \"$SOROBAN_NETWORK_PASSPHRASE\" }" > ./src/shared/config.json

if !(soroban config identity ls | grep token-admin 2>&1 >/dev/null); then
  echo "Create the token-admin identity"
  soroban config identity generate token-admin --network $NETWORK
fi
ADMIN_ADDRESS="$(soroban config identity address token-admin)"

# This will fail if the account already exists, but it'll still be fine.
echo "Fund token-admin account from friendbot"
soroban config identity fund token-admin --network $NETWORK
# curl --silent -X POST "$FRIENDBOT_URL?addr=$ADMIN_ADDRESS" >/dev/null

ARGS="--network $NETWORK --source token-admin"

# Compiles the smart contracts and stores WASM files in ./target/wasm32-unknown-unknown/release
echo "Build contracts"
soroban contract build

# Deploys the contracts and stores the contract IDs in .soroban-example-dapp

# The BTC Token contract is a Soroban token that represents BTC/USD
echo "Deploy the BTC TOKEN contract"
BTC_TOKEN_ID="$(
  soroban contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/soroban_token_contract.wasm
)"
echo "Contract deployed succesfully with ID: $BTC_TOKEN_ID"
echo -n "$BTC_TOKEN_ID" > .soroban-example-dapp/btc_token_id

# The donation contract is a Soroban contract that allows users to donate to a specific address
echo "Deploy the DONATION contract"
DONATION_ID="$(
  soroban contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/soroban_donation_contract.wasm
)"
echo "Contract deployed succesfully with ID: $DONATION_ID"
echo -n "$DONATION_ID" > .soroban-example-dapp/donation_id

# The oracle contract is responsible for calculating the price of BTC/USD
echo "Deploy the ORACLE contract"
ORACLE_ID="$(
  soroban contract deploy $ARGS \
    --wasm target/wasm32-unknown-unknown/release/soroban_oracle_contract.wasm
)"
echo "Contract deployed succesfully with ID: $ORACLE_ID"
echo "$ORACLE_ID" > .soroban-example-dapp/oracle_id

# Initialize the contracts
echo "Initialize the BTC TOKEN contract"
soroban contract invoke \
  $ARGS \
  --id "$BTC_TOKEN_ID" \
  -- \
  initialize \
  --symbol BTC \
  --decimal 8 \
  --name Bitcoin \
  --admin "$ADMIN_ADDRESS"
echo "Done"

# Recipient is the only account that can withdraw BTC from the donation contract
# Cannot make donations
echo "Initialize the DONATION contract"
soroban contract invoke \
  $ARGS \
  --id "$DONATION_ID" \
  -- \
  initialize \
  --recipient GCSXUXZSA2VEXN5VGOWE5ODAJLC575JCMWRJ4FFRDWSTRCJYQK4ML6V3 \
  --token "$BTC_TOKEN_ID" 
echo "Done"

# Relayer is the account that will be used to relay transactions to the oracle contract
echo "Initialize the ORACLE contract"
soroban contract invoke \
  $ARGS \
  --id "$ORACLE_ID" \
  -- \
  initialize \
  --caller GCSXUXZSA2VEXN5VGOWE5ODAJLC575JCMWRJ4FFRDWSTRCJYQK4ML6V3 \
  --pair_name BTC_USDT \
  --epoch_interval 600 \
  --relayer GCSXUXZSA2VEXN5VGOWE5ODAJLC575JCMWRJ4FFRDWSTRCJYQK4ML6V3
echo "Done"
