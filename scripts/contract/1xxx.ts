import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

async function main() {
    const signers: Signer[] = await ethers.getSigners()
    let tokenInstance: Contract;

    // hre.tracer.nameTags[await signers[0].getAddress()] = "ADMIN";


    const Token = await ethers.getContractFactory("TestToken", signers[0]);
    tokenInstance = await Token.deploy()


}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error);
        process.exit(1);
    })