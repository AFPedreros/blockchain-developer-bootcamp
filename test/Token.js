const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {

	return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Token", () => {

	let token,
		accounts,
		deployer,
		receiver,
		exchange

	beforeEach(async () => {
		//Fetch Token from blockchain
		const Token = await ethers.getContractFactory("Token")
		token = await Token.deploy("My Token", "EMR", "1000000")

		accounts = await ethers.getSigners()
		deployer = accounts[0]
		receiver = accounts[1]
		exchange = accounts[2]
	})

	describe("Deployment", () => {

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

		it("Assigns total supply to deployer", async () => {
			//Check that the total supply of the deployer is correct
			expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
		})

	})

	describe("Sending tokens", () => {

		let amount,
			transaction,
			result

		describe("Success", () => {

			beforeEach( async () => {

				amount = tokens(100)
				transaction = await token.connect(deployer).transfer(receiver.address, amount)
				result = await transaction.wait()
			})

			it("transfer token balances", async () => {
				//Transfer tokens
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
				expect(await token.balanceOf(receiver.address)).to.equal(amount)
			})

			it("emits a Transfer event", async () => {
				//Check the event
				const event = result.events[0]
				expect(event.event).to.equal("Transfer")

				const args = event.args
				expect(args.from).to.equal(deployer.address)
				expect(args.to).to.equal(receiver.address)
				expect(args.value).to.equal(amount)
			})
		})

		describe("Failure", () => {

			it("reject insufficient balance", async () => {
				//Transfer more tokens than the deplyer has
				const invalidAmount = tokens(10000000)
				await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
			})

			it("reject invalid recipent", async () => {
				//Doesn't allow to burn tokens
				await expect(token.connect(deployer).transfer("0x0000000000000000000000000000000000000000", amount)).to.be.reverted
			})
		})
	})

	describe("Approving tokens", () => {

		let amount,
			transaction,
			result

		beforeEach(async () => {

			amount = tokens(100)
			transaction = await token.connect(deployer).
				approve(exchange.address, amount)
			result = await transaction.wait()
		})

		describe("Success", () => {

			it("allocates an allowance for delegated token spending", async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
			})

			it("emits a Approval event", async () => {
				//Check the event
				const event = result.events[0]
				expect(event.event).to.equal("Approval")

				const args = event.args
				expect(args.owner).to.equal(deployer.address)
				expect(args.spender).to.equal(exchange.address)
				expect(args.value).to.equal(amount)
			})
		})

		describe("Failure", () => {

			it("reject invalid spenders", async () => {
				await expect(token.connect(deployer).approve("0x0000000000000000000000000000000000000000", amount)).to.be.reverted
			})
		})
	})

	describe("Delegated token transfers", () => {

		let amount,
			transaction,
			result

		beforeEach( async () => {

				amount = tokens(100)
				transaction = await token.connect(deployer).approve(exchange.address, amount)
				result = await transaction.wait()
		})

		describe("Success", () => {

			beforeEach(async () => {

				transaction = await token.connect(exchange).
				transferFrom(deployer.address, receiver.address, amount)
				result = await transaction.wait()
			})

			it("transfer token balances", async () => {
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
				expect(await token.balanceOf(receiver.address)).to.equal(amount)
			})
			
			it("resets the allowance", async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
			})

			it("emits a Transfer event", async () => {
				//Check the event
				const event = result.events[0]
				expect(event.event).to.equal("Transfer")

				const args = event.args
				expect(args.from).to.equal(deployer.address)
				expect(args.to).to.equal(receiver.address)
				expect(args.value).to.equal(amount)
			})

		})

		describe("Failure", async () => {
			
			const invalidAmount = tokens(100000000)
			it("reject invalid amout balance", async () => {
				await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
			})
		})

	})

})
