import cron from "node-cron";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  scValToNative,
  Address,
  SorobanRpc,
} from "@stellar/stellar-sdk";

const API_NINJA_KEY = "T4h5fYItj+wjWfXgkbeXOg==EsnPAMaIRZ0618O4";

const sourceSecretKey = "SBLUWQWVZLCDI3YIAFXWNU24GYHNKUMI47W6UKXVJ5HI7P2JV7MFK4OX";
const sourceKeypair = Keypair.fromSecret(sourceSecretKey);
const sourcePublicKey = sourceKeypair.publicKey();

const contractId = "CCADJU57KE6J3SCEOVQAOH7E763623DUD3AOKS7XQUX77FRQL2IWK7SR";
const contract = new Contract(contractId);

const server = new SorobanRpc.Server(
  "https://rpc-futurenet.stellar.org",
  { allowHttp: true }
);

const networkPassphrase = Networks.FUTURENET;
const fee = "100";

const getTimestamp = async () => {
  let account = await server.getAccount(sourcePublicKey);
  try {
    let transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(contract.call("get_timestamp"))
      .setTimeout(30)
      .build();

    let resultSimulation = await server.simulateTransaction(transaction);
    if (!SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      throw new Error(
        `[ERROR] [getTimestamp]: ${JSON.stringify(resultSimulation)}`
      );
    }
    return scValToNative(resultSimulation.result!.retval);
  } catch (e) {
    console.error(e);
    throw new Error("[getTimestamp] ERROR");
  }
};

const getPairInfo = async () => {
  let account = await server.getAccount(sourcePublicKey);
  try {
    let transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(contract.call("get_pair_info"))
      .setTimeout(30)
      .build();

    let resultSimulation = await server.simulateTransaction(transaction);
    if (!SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      throw new Error(
        `[ERROR] [getPairInfo]: ${JSON.stringify(resultSimulation)}`
      );
    }
    return scValToNative(resultSimulation.result!.retval);
  } catch (e) {
    console.error(e);
    throw new Error("[getPairInfo] ERROR");
  }
};

const getEpochData = async (epochNr: any) => {
  let account = await server.getAccount(sourcePublicKey);
  try {
    epochNr = nativeToScVal(epochNr, { type: "u32" });

    let transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(contract.call("get_pair_data_at_epoch", ...[epochNr]))
      .setTimeout(30)
      .build();

    let resultSimulation = await server.simulateTransaction(transaction);
    if (!SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      throw new Error(`[ERROR] [const getEpochData = async (epochNr) => {
        ]: ${JSON.stringify(resultSimulation)}`);
    }
    return scValToNative(resultSimulation.result!.retval);
  } catch (e) {
    console.error(e);
    throw new Error("[getEpochData] ERROR");
  }
};

const getPairPrice = async (pairName: any) => {
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/cryptoprice?symbol=${pairName}`,
      {
        headers: {
          "X-Api-Key": API_NINJA_KEY,
        },
      }
    );
    const result = await response.json();
    return parseInt((parseFloat(result?.price) * 10 ** 5).toString());
  } catch (e) {
    console.error(e);
    throw new Error("[getPairPrice] ERROR");
  }
};

const updatePairPrice = async (price: any) => {
  try {
    let account = await server.getAccount(sourcePublicKey);
    const value = nativeToScVal(price, { type: "u32" });
    const caller = new Address(account.accountId()).toScVal();

    const operation = contract.call("set_epoch_data", ...[caller, value]);
    let transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    transaction = await server.prepareTransaction(
      transaction
    );
    transaction.sign(sourceKeypair);
    let response = await server.sendTransaction(transaction);
    let resultSimulation = await server.simulateTransaction(transaction);
    console.log(
      "[updatePairPrice] Transaction hash:",
      `https://futurenet.steexp.com/${response.hash}`
    );

    const hash = response.hash;
    if (response.status === "ERROR") {
      console.log("[updatePairPrice] ERROR STATUS");
      throw new Error("[updatePairPrice] ERROR STATUS");
    }

    while (response.status != "PENDING") {
      let response = await server.getTransaction(hash);
      console.log("[updatePairPrice] response.status: ", response.status);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    if (SorobanRpc.Api.isSimulationSuccess(resultSimulation)) {
      console.log("[updatePairPrice] SUCCESS");
      console.log("[updatePairPrice] Transaction status:", response.status);
    } else {
      console.log("[updatePairPrice] ERROR ");
      throw new Error("[updatePairPrice] ERROR ");
    }
  } catch (e) {
    console.error(e);
    throw new Error("[updatePairPrice] ERROR");
  }
};

const main = async () => {
  try {
    const pairInfo = await getPairInfo();
    const epochInterval = parseInt(pairInfo.epoch_interval);
    const currentTimestamp = await getTimestamp();
    const lastEpochNr = pairInfo.last_epoch;
    console.log("lastEpochNr ", lastEpochNr);

    let lastEpochTimestamp = 0;
    if (lastEpochNr > 0) {
      const lastEpochData = await getEpochData(lastEpochNr);
      lastEpochTimestamp = parseInt(lastEpochData.time);

      const lastEpochPrice = parseInt(lastEpochData.value);
      console.log("lastEpochPrice ", lastEpochPrice);
    }

    let deltaTimestamp = Number(currentTimestamp) - lastEpochTimestamp;
    console.log("deltaTimestamp ", deltaTimestamp);
    if (deltaTimestamp >= epochInterval) {
      console.log("Need to update the value");
    } else {
      console.log("Don't need to update the value");
      return;
    }

    const priceData = await getPairPrice("BTCUSDT");
    console.log("fetched priceData ", priceData);

    const updatePairPriceResult = await updatePairPrice(priceData);
    console.log("value set!");
  } catch (e) {
    console.log("ERROR");
    console.error(e);
  }
};

cron.schedule("*/15 * * * *", async () => {
  console.log("Running a task every 15 minutes");
  console.log("Current Time: ", new Date());
  await main();
});
