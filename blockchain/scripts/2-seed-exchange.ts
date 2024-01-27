import { EventLog } from "ethers";
import { ethers } from "hardhat";

import config from "../../src/config.json";
import { tokens, wait } from "../utils";

async function main() {
  const accounts = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();
  console.log("Chain ID:", chainId);

  // Get tokens
  const CoffeeToken = await ethers.getContractAt(
    "Token",
    config[chainId.toString() as keyof typeof config].CoffeeToken.address
  );
  const coffeeTokenAddress = await CoffeeToken.getAddress();
  console.log(`CoffeeToken fetched: ${coffeeTokenAddress}`);

  const mETH = await ethers.getContractAt(
    "Token",
    config[chainId.toString() as keyof typeof config].mETH.address
  );
  const mETHAddress = await mETH.getAddress();
  console.log(`mETH fetched: ${mETHAddress}`);

  const mDAI = await ethers.getContractAt(
    "Token",
    config[chainId.toString() as keyof typeof config].mDAI.address
  );
  const mDAIAddress = await mDAI.getAddress();
  console.log(`mDAI fetched: ${mDAIAddress}`);

  // Get exchange
  const Exchange = await ethers.getContractAt(
    "Exchange",
    config[chainId.toString() as keyof typeof config].exchange.address
  );
  const exchangeAddress = await Exchange.getAddress();
  console.log(`Exchange fetched: ${exchangeAddress}`);

  // Give tokens to accounts
  const sender = accounts[0];
  const receiver = accounts[1];
  let amount = tokens(10000);

  let transaction = await mETH
    .connect(sender)
    .transfer(receiver.address, amount);
  let receipt = await transaction.wait();
  console.log(
    `Transferred ${amount} mETH from ${sender.address} to ${receiver.address}\n`
  );

  // Set up exchange users
  const user1 = accounts[0];
  const user2 = accounts[1];
  amount = tokens(10000);

  // User 1 approves exchange to spend Coffee tokens
  transaction = await CoffeeToken.connect(user1).approve(
    exchangeAddress,
    amount
  );
  receipt = await transaction.wait();
  console.log(
    `Approved ${amount} CoffeeToken from ${user1.address} for exchange\n`
  );

  // User 1 deposits tokens into exchange
  transaction = await Exchange.connect(user1).depositToken(
    coffeeTokenAddress,
    amount
  );
  receipt = await transaction.wait();
  console.log(
    `Deposited ${amount} CoffeeToken into exchange from ${user1.address}\n`
  );

  // User 2 approves exchange to spend mETH
  transaction = await mETH.connect(user2).approve(exchangeAddress, amount);
  receipt = await transaction.wait();
  console.log(`Approved ${amount} mETH from ${user2.address} for exchange\n`);

  // User 2 deposits tokens into exchange
  transaction = await Exchange.connect(user2).depositToken(mETHAddress, amount);
  receipt = await transaction.wait();
  console.log(`Deposited ${amount} mETH into exchange from ${user2.address}\n`);

  // Seed a cancel order
  let orderId;
  transaction = await Exchange.connect(user1).makeOrder(
    mETHAddress,
    tokens(100),
    coffeeTokenAddress,
    tokens(5)
  );
  receipt = await transaction.wait();
  console.log(`Made order from ${user1.address}\n`);

  orderId = (receipt?.logs[0] as EventLog).args?.id;
  transaction = await Exchange.connect(user1).cancelOrder(orderId);
  receipt = await transaction.wait();
  console.log(`Cancelled order from ${user1.address}\n`);

  await wait(1);

  // Seed a fill orders
  transaction = await Exchange.connect(user1).makeOrder(
    mETHAddress,
    tokens(100),
    coffeeTokenAddress,
    tokens(10)
  );
  receipt = await transaction.wait();
  console.log(`Made order from ${user1.address}\n`);

  orderId = (receipt?.logs[0] as EventLog).args?.id;
  transaction = await Exchange.connect(user2).fillOrder(orderId);
  receipt = await transaction.wait();
  console.log(`Filled order from ${user1.address}\n`);

  await wait(1);

  transaction = await Exchange.connect(user1).makeOrder(
    mETHAddress,
    tokens(50),
    coffeeTokenAddress,
    tokens(15)
  );
  receipt = await transaction.wait();
  console.log(`Made order from ${user1.address}\n`);

  orderId = (receipt?.logs[0] as EventLog).args?.id;
  transaction = await Exchange.connect(user2).fillOrder(orderId);
  receipt = await transaction.wait();
  console.log(`Filled order from ${user1.address}\n`);

  await wait(1);

  // Seed open orders
  for (let i = 0; i <= 10; i++) {
    transaction = await Exchange.connect(user1).makeOrder(
      mETHAddress,
      tokens(10 * i),
      coffeeTokenAddress,
      tokens(10)
    );
    receipt = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    await wait(1);
  }

  for (let i = 0; i <= 10; i++) {
    transaction = await Exchange.connect(user2).makeOrder(
      coffeeTokenAddress,
      tokens(10),
      mETHAddress,
      tokens(10 * i)
    );
    receipt = await transaction.wait();
    console.log(`Made order from ${user2.address}`);

    await wait(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
