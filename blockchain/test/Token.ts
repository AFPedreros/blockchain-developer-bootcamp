import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { Token } from "../typechain-types";

const tokens = (n: number) => {
  return ethers.parseEther(n.toString());
};

describe("Token", () => {
  let token: Token;
  let accounts: HardhatEthersSigner[];
  let deployer: HardhatEthersSigner;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");

    token = await Token.deploy("Coffee Token", "COF", 1000000);
    await token.waitForDeployment();

    accounts = await ethers.getSigners();
    deployer = accounts[0];
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
});
