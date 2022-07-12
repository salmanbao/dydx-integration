import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import hre from "hardhat";
import { ethers } from "hardhat";
import { impersonatedAccount } from "./constants";



export const getTime = async (): Promise<number> => {
    return (await hre.ethers.provider.getBlock("latest")).timestamp
}

export async function increaseTime(duration: number): Promise<void> {
    ethers.provider.send("evm_increaseTime", [duration]);
    ethers.provider.send("evm_mine", []);
}

export const Impersonate = async():Promise<SignerWithAddress> =>{
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [impersonatedAccount],
      });
      const signer = await ethers.getSigner(impersonatedAccount)
      return signer;
}   

export const setBalance = async():Promise<void> =>{
    await hre.network.provider.send("hardhat_setBalance", [
        impersonatedAccount,
        "0x"+parseEther("10000").toString(),
      ]);
}