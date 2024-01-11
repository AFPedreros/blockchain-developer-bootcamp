import { expect } from "chai";
import { ethers } from "hardhat";

import { Token } from "../typechain-types";

const tokens = (n: number) => {
  return ethers.parseEther(n.toString());
};

describe("Token", () => {
  let token: Token;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");

    token = await Token.deploy("Coffee Token", "COF", 1000000);
    await token.waitForDeployment();
  });

  describe("Deployment", () => {
    const name = "Coffee Token";
    const symbol = "COF";
    const decimals = 18;
    const totalSupply = tokens(1000000);

    it("Should return the right name", async () => {
      const name = await token.name();

      expect(name).to.equal(name);
    });

    it("Should return the right symbol", async () => {
      const symbol = await token.symbol();

      expect(symbol).to.equal(symbol);
    });

    it("Should return the right decimals", async () => {
      const decimals = await token.decimals();

      expect(decimals).to.equal(decimals);
    });

    it("Should return the right total supply", async () => {
      const totalSupply = await token.totalSupply();

      expect(totalSupply).to.equal(totalSupply);
    });
  });
});
