"use client";

import { useEffect } from "react";
import { Contract, ethers } from "ethers";
import config from "@/lib/config.json";
import Token from "~/artifacts/contracts/Token.sol/Token.json";

const TOKEN_ABI = Token.abi;
const TOKEN_ADDRESS = config[31337].CoffeeToken.address;

export default function Header() {
  async function loadBlockchainData() {
    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("[ADDRESS]", accounts[0]);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const { chainId } = await provider.getNetwork();
      const signer = await provider.getSigner();

      const coffeeToken = new ethers.Contract(
        config[chainId.toString() as keyof typeof config].mDAI.address,
        TOKEN_ABI,
        provider,
      );

      const tokenAddress = await coffeeToken.getAddress();
      console.log("[TOKEN]", tokenAddress);

      const symbol = await coffeeToken.symbol();
      console.log("Symbol:", symbol);
    } catch (error) {
      console.error("Error in blockchain data loading", error);
    }
  }

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <header className="container flex h-20 w-full items-center justify-between">
      <div>Localhost</div> <div>Wallet balance</div>
    </header>
  );
}
