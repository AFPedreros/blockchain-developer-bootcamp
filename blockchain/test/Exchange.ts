import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import {
  BigNumberish,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  EventLog,
} from "ethers";
import { ethers } from "hardhat";

import { Exchange, Token } from "../typechain-types";

const tokens = (n: number) => {
  return ethers.parseEther(n.toString());
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Exchange", () => {
  let exchange: Exchange;
  let token1: Token;
  let accounts: HardhatEthersSigner[];
  let deployer: HardhatEthersSigner;
  let feeAccount: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  let transaction: ContractTransactionResponse;

  const feePercent = 10;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    user1 = accounts[2];
    user2 = accounts[3];

    const Exchange = await ethers.getContractFactory("Exchange");
    const Token = await ethers.getContractFactory("Token");

    token1 = await Token.deploy("Coffee Token", "COF", 1000000);
    await token1.waitForDeployment();

    transaction = await token1
      .connect(deployer)
      .transfer(user1.address, tokens(100));
    await transaction.wait();

    transaction = await token1
      .connect(deployer)
      .transfer(user2.address, tokens(100));
    await transaction.wait();

    exchange = await Exchange.deploy(feeAccount, feePercent);
    await exchange.waitForDeployment();
  });

  describe("Deployment", () => {
    it("Should assign the fee account", async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address);
    });

    it("Should assign the fee percent", async () => {
      expect(await exchange.feePercent()).to.equal(feePercent);
    });
  });

  describe("Deposit", () => {
    let amount: BigNumberish;

    let receipt: ContractTransactionReceipt | null;

    beforeEach(async () => {
      amount = tokens(10);

      transaction = await token1
        .connect(user1)
        .approve(exchange.getAddress(), amount);
      receipt = await transaction.wait();

      transaction = await exchange
        .connect(user1)
        .depositToken(token1.getAddress(), amount);
      receipt = await transaction.wait();
    });

    describe("Success", () => {
      it("Should deposit tokens", async () => {
        expect(await token1.balanceOf(exchange.getAddress())).to.equal(amount);
        expect(
          await exchange.tokens(token1.getAddress(), user1.address)
        ).to.equal(amount);
        expect(
          await exchange.balanceOf(token1.getAddress(), user1.address)
        ).to.equal(amount);
      });

      it("Should emit a Deposit event", async () => {
        const events = receipt?.logs[1] as EventLog;
        const event = events?.fragment;

        expect(event.name).to.equal("Deposit");

        const args = events?.args;

        expect(args.token).to.equal(await token1.getAddress());
        expect(args.user).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("Should reject deposits when tokens are not approved", async () => {
        await expect(
          exchange.connect(user2).depositToken(token1.getAddress(), amount)
        ).to.be.revertedWith("Not enough allowance");
      });
    });
  });
});
