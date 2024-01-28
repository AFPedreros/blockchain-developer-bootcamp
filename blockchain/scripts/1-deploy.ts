import * as fs from "fs";
import { ethers } from "hardhat";

import config from "../../src/lib/config.json";

async function main() {
  const Token = await ethers.getContractFactory("Token");
  const Exchange = await ethers.getContractFactory("Exchange");

  const accounts = await ethers.getSigners();

  console.log(
    `Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`
  );

  const coffeeToken = await Token.deploy("CoffeeToken", "COF", 100000000);
  await coffeeToken.waitForDeployment();
  const coffeeTokenAddress = await coffeeToken.getAddress();
  console.log(`Coffee token deployed to: ${coffeeTokenAddress}`);

  const mETH = await Token.deploy("MockETH", "mETH", 100000000);
  await mETH.waitForDeployment();
  const mETHAddress = await mETH.getAddress();
  console.log(`mETH token deployed to: ${mETHAddress}`);

  const mDAI = await Token.deploy("MockDAI", "mDAI", 100000000);
  await mDAI.waitForDeployment();
  const mDAIAddress = await mDAI.getAddress();
  console.log(`mDAI token deployed to: ${mDAIAddress}`);

  const exchange = await Exchange.deploy(accounts[1].address, 10);
  await exchange.waitForDeployment();
  const exchangeAddress = await exchange.getAddress();
  console.log(`Exchange deployed to: ${exchangeAddress}`);

  config["31337"] = {
    ...config["31337"],
    exchange: { address: exchangeAddress },
    CoffeeToken: { address: coffeeTokenAddress },
    mETH: { address: mETHAddress },
    mDAI: { address: mDAIAddress },
  };

  fs.writeFileSync("../src/config.json", JSON.stringify(config, null, 2));
  console.log("Config file updated with new contract addresses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
