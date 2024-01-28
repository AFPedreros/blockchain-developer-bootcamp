"use client";

import { useEffect } from "react";
import { ethers } from "ethers";

type Props = {};

export default function Header({}: Props) {
  async function loadBlockchainData() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log(accounts[0]);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    console.log(network);
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
