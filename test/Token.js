const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {

	return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Token", () => {

	let token;

	beforeEach(async () => {
		//Fetch Token from blockchain
		const Token = await ethers.getContractFactory("Token")
		token = await Token.deploy("My Token", "EMR", "1000000")
	})

	describe("Deployment", () =>{

		const name = "My Token"
		const symbol = "EMR"
		const decimals = "18"
		const totalSupply = tokens("1000000")

		it("Has correct name", async () => {
		//Check that name is correct
		expect(await token.name()).to.equal(name)
		})

		it("Has correct symbol", async () => {
			//Check that symbol is correct
			expect(await token.symbol()).to.equal(symbol)
		})

		it("Has correct decimals", async () => {
			//Check that decimals is correct
			expect(await token.decimals()).to.equal(decimals)
		})

			it("Has correct supply", async () => {
			//Check that supply is correct
			expect(await token.totalSupply()).to.equal(totalSupply)
		})

	})


})
