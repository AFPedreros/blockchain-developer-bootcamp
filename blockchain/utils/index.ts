import { ethers } from "hardhat";

export const tokens = (n: number) => {
  return ethers.parseEther(n.toString());
};

export const wait = (seconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
