import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import {
  BigNumberish,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  EventLog,
} from "ethers";
import { ethers } from "hardhat";

import { Exchange } from "../typechain-types";

const tokens = (n: number) => {
  return ethers.parseEther(n.toString());
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Exchange", () => {
  let exchange: Exchange;
  let accounts: HardhatEthersSigner[];
  let deployer: HardhatEthersSigner;
  let feeAccount: HardhatEthersSigner;

  const feePercent = 10;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];

    const Exchange = await ethers.getContractFactory("Exchange");

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
});
