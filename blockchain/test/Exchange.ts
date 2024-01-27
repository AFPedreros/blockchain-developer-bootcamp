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
import { tokens } from "../utils";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Exchange", () => {
  let exchange: Exchange;
  let token1: Token;
  let token2: Token;
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
    token2 = await Token.deploy("Mock Dai", "MDAI", 1000000);
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

  describe("Withdraw", () => {
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

      transaction = await exchange
        .connect(user1)
        .withdrawToken(token1.getAddress(), amount);
      receipt = await transaction.wait();
    });

    describe("Success", () => {
      it("Should withdraw tokens", async () => {
        expect(await token1.balanceOf(exchange.getAddress())).to.equal(0);
        expect(
          await exchange.tokens(token1.getAddress(), user1.address)
        ).to.equal(0);
        expect(
          await exchange.balanceOf(token1.getAddress(), user1.address)
        ).to.equal(0);
      });

      it("Should emit a Withdraw event", async () => {
        const events = receipt?.logs[1] as EventLog;
        const event = events?.fragment;

        expect(event.name).to.equal("Withdraw");

        const args = events?.args;

        expect(args.token).to.equal(await token1.getAddress());
        expect(args.user).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(0);
      });
    });

    describe("Failure", () => {
      it("Should fail when user doesn't have enough tokens", async () => {
        await expect(
          exchange.connect(user1).withdrawToken(token1.getAddress(), amount)
        ).to.be.revertedWith("Not enough tokens");
      });
    });
  });

  describe("Check balances", () => {
    let amount: BigNumberish;

    let receipt: ContractTransactionReceipt | null;

    beforeEach(async () => {
      amount = tokens(1);

      transaction = await token1
        .connect(user1)
        .approve(exchange.getAddress(), amount);
      receipt = await transaction.wait();

      transaction = await exchange
        .connect(user1)
        .depositToken(token1.getAddress(), amount);
      receipt = await transaction.wait();
    });

    it("Should return user balance", async () => {
      expect(
        await exchange.balanceOf(token1.getAddress(), user1.address)
      ).to.equal(amount);
    });
  });

  describe("Orders", () => {
    let amountGet: BigNumberish;
    let amountGive: BigNumberish;
    let receipt: ContractTransactionReceipt | null;

    beforeEach(async () => {
      amountGet = tokens(10);
      amountGive = tokens(10);

      transaction = await token1
        .connect(user1)
        .approve(exchange.getAddress(), amountGive);
      receipt = await transaction.wait();

      transaction = await exchange
        .connect(user1)
        .depositToken(token1.getAddress(), amountGive);
      receipt = await transaction.wait();

      transaction = await exchange
        .connect(user1)
        .makeOrder(
          token2.getAddress(),
          amountGet,
          token1.getAddress(),
          amountGive
        );
      receipt = await transaction.wait();
    });

    describe("Make orders", () => {
      describe("Success", () => {
        it("Should create an order", async () => {
          expect(await exchange.orderId()).to.equal(1);
          const order = await exchange.orders(0);
          expect(order.id).to.equal(0);
          expect(order.user).to.equal(user1.address);
          expect(order.tokenGet).to.equal(await token2.getAddress());
          expect(order.amountGet).to.equal(amountGet);
          expect(order.tokenGive).to.equal(await token1.getAddress());
          expect(order.amountGive).to.equal(amountGive);
          expect(order.timestamp).to.at.least(1);
        });

        it("Should emit an Order event", async () => {
          const events = receipt?.logs[0] as EventLog;
          const event = events?.fragment;

          expect(event.name).to.equal("Order");

          const args = events?.args;

          expect(args.id).to.equal(0);
          expect(args.user).to.equal(user1.address);
          expect(args.tokenGet).to.equal(await token2.getAddress());
          expect(args.amountGet).to.equal(amountGet);
          expect(args.tokenGive).to.equal(await token1.getAddress());
          expect(args.amountGive).to.equal(amountGive);
          expect(args.timestamp).to.at.least(1);
        });
      });

      describe("Failure", () => {
        it("Should reject invalid tokens", async () => {
          await expect(
            exchange
              .connect(user1)
              .makeOrder(
                ZERO_ADDRESS,
                amountGet,
                token1.getAddress(),
                amountGive
              )
          ).to.be.revertedWith("TokenGet cannot be 0x0");
        });

        it("Should reject invalid amounts", async () => {
          await expect(
            exchange
              .connect(user1)
              .makeOrder(
                token2.getAddress(),
                tokens(100),
                token1.getAddress(),
                tokens(100)
              )
          ).to.be.revertedWith("Not enough tokens");
        });
      });
    });

    describe("Cancel orders", () => {
      describe("Success", () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user1).cancelOrder(0);
          receipt = await transaction.wait();
        });

        it("Should cancel an order", async () => {
          const order = await exchange.orders(0);
          expect(order.id).to.equal(0);
          expect(order.user).to.equal(user1.address);
          expect(order.tokenGet).to.equal(await token2.getAddress());
          expect(order.amountGet).to.equal(amountGet);
          expect(order.tokenGive).to.equal(await token1.getAddress());
          expect(order.amountGive).to.equal(amountGive);
          expect(order.timestamp).to.at.least(1);
        });

        it("Should emit a Cancel event", async () => {
          const events = receipt?.logs[0] as EventLog;
          const event = events?.fragment;

          expect(event.name).to.equal("Cancel");

          const args = events?.args;

          expect(args.id).to.equal(0);
          expect(args.user).to.equal(user1.address);
          expect(args.tokenGet).to.equal(await token2.getAddress());
          expect(args.amountGet).to.equal(amountGet);
          expect(args.tokenGive).to.equal(await token1.getAddress());
          expect(args.amountGive).to.equal(amountGive);
          expect(args.timestamp).to.at.least(1);
        });
      });

      describe("Failure", () => {
        it("Should reject invalid order ids", async () => {
          await expect(
            exchange.connect(user1).cancelOrder(1)
          ).to.be.revertedWith("Invalid order id");
        });

        it("Should reject unauthorized cancelations", async () => {
          await expect(
            exchange.connect(user2).cancelOrder(0)
          ).to.be.revertedWith("Unauthorized");
        });
      });
    });

    describe("Fill orders", () => {
      beforeEach(async () => {
        transaction = await token2
          .connect(deployer)
          .transfer(user2.address, tokens(100));

        transaction = await token2
          .connect(user2)
          .approve(exchange.getAddress(), tokens(20));
        receipt = await transaction.wait();

        transaction = await exchange
          .connect(user2)
          .depositToken(token2.getAddress(), tokens(20));
        receipt = await transaction.wait();
      });

      describe("Success", () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user2).fillOrder(0);
          receipt = await transaction.wait();
        });

        it("Should fill an order", async () => {
          const order = await exchange.orders(0);
          expect(order.id).to.equal(0);

          expect(
            await exchange.balanceOf(token1.getAddress(), user1.address)
          ).to.equal(0);
          expect(
            await exchange.balanceOf(token2.getAddress(), user1.address)
          ).to.equal(amountGet);
          expect(
            await exchange.balanceOf(token1.getAddress(), user2.address)
          ).to.equal(amountGive);
          expect(
            await exchange.balanceOf(token2.getAddress(), user2.address)
          ).to.equal(tokens(9));
        });

        it("Should charge fees", async () => {
          expect(
            await exchange.balanceOf(token2.getAddress(), feeAccount.address)
          ).to.equal(tokens(1));
        });

        it("Should emit a Trade event", async () => {
          const events = receipt?.logs[0] as EventLog;
          const event = events?.fragment;

          expect(event.name).to.equal("Trade");

          const args = events?.args;

          expect(args.id).to.equal(0);
          expect(args.user).to.equal(user1.address);
          expect(args.tokenGet).to.equal(await token2.getAddress());
          expect(args.amountGet).to.equal(amountGet);
          expect(args.tokenGive).to.equal(await token1.getAddress());
          expect(args.amountGive).to.equal(amountGive);
          expect(args.userFill).to.equal(user2.address);
          expect(args.timestamp).to.at.least(1);
        });

        it("Should mark orders as filled", async () => {
          expect(await exchange.orderFilled(0)).to.equal(true);
        });
      });

      describe("Failure", () => {
        it("Should reject invalid order ids", async () => {
          await expect(exchange.connect(user2).fillOrder(1)).to.be.revertedWith(
            "Invalid order id"
          );
        });
        it("Should reject already filled orders", async () => {
          await exchange.connect(user2).fillOrder(0);
          await expect(exchange.connect(user2).fillOrder(0)).to.be.revertedWith(
            "Order already filled"
          );
        });
        it("Should reject cancelled orders", async () => {
          transaction = await exchange
            .connect(user1)
            .makeOrder(
              token2.getAddress(),
              amountGet,
              token1.getAddress(),
              amountGive
            );
          await transaction.wait();
          await exchange.connect(user1).cancelOrder(1);
          await expect(exchange.connect(user2).fillOrder(1)).to.be.revertedWith(
            "Order already cancelled"
          );
        });
      });
    });
  });
});
