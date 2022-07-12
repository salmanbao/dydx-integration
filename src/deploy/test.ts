import { Contract } from '@ethersproject/contracts'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { contractNames } from '../ts/deploy';

interface IDeployedContracts {
  [P: string]: Contract;
}

const deployContract: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const {
    TestToken,
    } = contractNames;

  let contracts: IDeployedContracts = {};
  const signers = await hre.ethers.getSigners();

  const testToken = await hre.ethers.getContractFactory(TestToken, signers[0])
  contracts.TestToken = await testToken.deploy()

  

  console.log("testToken", contracts.TestToken.address)


  try {
    await hre.run('verify', {
      address: contracts.TestToken.address,
      constructorArgsParams: [],
    })
  } catch (error) {
    console.log(`Smart contract at address ${contracts.TestToken.address} is already verified`)
  }


}

export default deployContract
