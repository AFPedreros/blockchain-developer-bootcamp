import { ethers } from "hardhat";

async function main() {
  const Token = await ethers.getContractFactory("Token");

  const token = await Token.deploy();
  await token.waitForDeployment();
  const address = await token.getAddress();
  console.log(`Token deployed to: ${address}`);

  const name = await token.name();

  console.log(`Token name: ${name}`);

  const accounts = await ethers.getSigners();
  const account = accounts[0];
  const balance = await ethers.provider.getBalance(account.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log(`Account balance: ${balanceInEth}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
