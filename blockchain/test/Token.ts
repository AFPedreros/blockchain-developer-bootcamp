import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import {
  BigNumberish,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  EventLog,
} from "ethers";
import { ethers } from "hardhat";

import { Token } from "../typechain-types";

const tokens = (n: number) => {
  return ethers.parseEther(n.toString());
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Token", () => {
  let token: Token;
  let accounts: HardhatEthersSigner[];
  let deployer: HardhatEthersSigner;
  let receiver: HardhatEthersSigner;
  let exchange: HardhatEthersSigner;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");

    token = await Token.deploy("Coffee Token", "COF", 1000000);
    await token.waitForDeployment();

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
    exchange = accounts[2];
  });

  describe("Deployment", () => {
    const name = "Coffee Token";
    const symbol = "COF";
    const decimals = 18;
    const totalSupply = tokens(1000000);

    it("Should return the right name", async () => {
      expect(await token.name()).to.equal(name);
    });

    it("Should return the right symbol", async () => {
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Should return the right decimals", async () => {
      expect(await token.decimals()).to.equal(decimals);
    });

    it("Should return the right total supply", async () => {
      expect(await token.totalSupply()).to.equal(totalSupply);
    });

    it("Should assign the total supply to the deployer", async () => {
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
    });
  });

  describe("Transactions", () => {
    let amount: BigNumberish;
    let transaction: ContractTransactionResponse;
    let receipt: ContractTransactionReceipt | null;

    describe("Success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, tokens(100));
        receipt = await transaction.wait();
      });

      it("Should transfer tokens between accounts", async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(amount);
      });

      it("Should emit a Transfer event", async () => {
        const events = receipt?.logs[0] as EventLog;
        const event = events?.fragment;

        expect(event.name).to.equal("Transfer");

        const args = events?.args;

        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("Should reject insufficient balances", async () => {
        const invalidAmount = tokens(100000000);
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.be.revertedWith("Not enough tokens");
      });

      it("Should reject invalid recipients", async () => {
        await expect(
          token.connect(deployer).transfer(ZERO_ADDRESS, amount)
        ).to.be.revertedWith("Invalid recipient");
      });
    });
  });

  describe("Approve", () => {
    let amount: BigNumberish;
    let transaction: ContractTransactionResponse;
    let receipt: ContractTransactionReceipt | null;

    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, tokens(100));
      receipt = await transaction.wait();
    });

    describe("Success", () => {
      it("Should approve token for delegated transfer", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(amount);
      });

      it("Should emit an Approval event", async () => {
        const events = receipt?.logs[0] as EventLog;
        const event = events?.fragment;

        expect(event.name).to.equal("Approval");

        const args = events?.args;

        expect(args.owner).to.equal(deployer.address);
        expect(args.spender).to.equal(exchange.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("Should reject invalid spender", async () => {
        await expect(
          token.connect(deployer).approve(ZERO_ADDRESS, amount)
        ).to.be.revertedWith("Invalid spender");
      });
    });
  });

  describe("Delegated transfer", () => {
    let amount: BigNumberish;
    let transaction: ContractTransactionResponse;
    let receipt: ContractTransactionReceipt | null;

    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, tokens(100));
      receipt = await transaction.wait();
    });

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount);
        receipt = await transaction.wait();
      });

      it("Should transfer tokens between accounts", async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(amount);
      });

      it("Should reset allowance", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(0);
      });

      it("Should emit a Transfer event", async () => {
        const events = receipt?.logs[0] as EventLog;
        const event = events?.fragment;

        expect(event.name).to.equal("Transfer");

        const args = events?.args;

        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("Should reject insufficient balances", async () => {
        const invalidAmount = tokens(100000000);
        await expect(
          token
            .connect(exchange)
            .transferFrom(deployer.address, receiver.address, invalidAmount)
        ).to.be.revertedWith("Not enough tokens");
      });

      it("Should reject insufficient allowance", async () => {
        const invalidAmount = tokens(1000);
        await expect(
          token
            .connect(exchange)
            .transferFrom(deployer.address, receiver.address, invalidAmount)
        ).to.be.revertedWith("Not enough allowance");
      });
    });
  });
});
