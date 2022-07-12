import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import BigNumber from "bignumber.js";
import { Order, OrderMapper, OrderType, TestOrder, ZeroExV2Order } from '@dydxprotocol/exchange-wrappers';
import hre, { ethers } from "hardhat";
import {
  TokenA__factory,
  UsdcPriceOracle__factory,
  WETH9__factory,
  WethPriceOracle__factory,
} from "../../typechain";
import {
  ONES_255,
  PolynomialInterestSetter,
  usdcAddress,
  UsdcPriceOracle,
  wethAddress,
  WethPriceOracle,
  ZERO,
  ZeroExV2ExchangeWrapper,
} from "../utils/constants";
import { Impersonate, setBalance } from "../utils/utilities";
import { parseEther } from "ethers/lib/utils";

interface AccountInfo {
  owner: string;
  number: number | string;
}

interface ActionArgs {
  actionType: number | string;
  accountId: number | string;
  amount: {
    sign: boolean;
    denomination: number | string;
    ref: number | string;
    value: number | string;
  };
  primaryMarketId: number | string;
  secondaryMarketId: number | string;
  otherAddress: string;
  otherAccountId: number | string;
  data: string | number[];
}

describe("Test Token", function () {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let signer: SignerWithAddress;
  let soloMarginInstance: Contract;
  let usdc: Contract;
  let weth: Contract;
  let usdcPriceOracle: Contract;
  let wethPriceOracle: Contract;

  before(async () => {
    [owner, user] = await ethers.getSigners();
    const mbv = "0.05";
    const RiskParams = {
      marginRatio: { value: parseEther("0.15") },
      liquidationSpread: { value: parseEther("0.05") },
      earningsRate: { value: parseEther("0.90") },
      minBorrowedValue: { value: parseEther(mbv) },
    };
    const RiskLimits = {
      marginRatioMax: parseEther("2.00"),
      liquidationSpreadMax: parseEther("0.50"),
      earningsRateMax: parseEther("1.00"),
      marginPremiumMax: parseEther("2.00"),
      spreadPremiumMax: parseEther("2.00"),
      minBorrowedValueMax: parseEther("100.00"),
    };
    await setBalance();
    signer = await Impersonate();

    const AdminImplFactory = await ethers.getContractFactory("AdminImpl");
    const AdminImpl = await AdminImplFactory.deploy();

    const OperationImplFactory = await ethers.getContractFactory(
      "OperationImpl"
    );
    const OperationImpl = await OperationImplFactory.deploy();

    const SoloMarginFactory = await ethers.getContractFactory("SoloMargin", {
      libraries: {
        AdminImpl: AdminImpl.address,
        OperationImpl: OperationImpl.address,
      },
    });
    soloMarginInstance = await SoloMarginFactory.connect(signer).deploy(RiskParams, RiskLimits);

    hre.tracer.nameTags[owner.address] = "ADMIN";
    hre.tracer.nameTags[user.address] = "USER1";
    hre.tracer.nameTags[soloMarginInstance.address] = "SOLO-MARGIN";

    usdc = TokenA__factory.connect(usdcAddress, signer);
    weth = WETH9__factory.connect(wethAddress,signer)
    usdcPriceOracle = UsdcPriceOracle__factory.connect(UsdcPriceOracle, signer);
    wethPriceOracle = WethPriceOracle__factory.connect(WethPriceOracle, signer);
    const marginPremium = { value: '0' };
    const spreadPremium = { value: '0' };
    await usdc.connect(signer).approve(soloMarginInstance.address,ONES_255)
    await soloMarginInstance
      .connect(signer)
      .ownerAddMarket(
        usdc.address,
        UsdcPriceOracle,
        PolynomialInterestSetter,
        marginPremium,
        spreadPremium
      );
      await soloMarginInstance
      .connect(signer)
      .ownerAddMarket(
        weth.address,
        WethPriceOracle,
        PolynomialInterestSetter,
        marginPremium,
        spreadPremium
      );

  });

  it("Deposit usdc", async function () {
    let accounts: AccountInfo[] = [
      {
        owner: signer.address,
        number: 0,
      },
    ];
    let actions: ActionArgs[] = [
      {
        actionType: 0, // Deposit
        accountId: 0,
        amount: {
          sign: true,
          denomination: 0,
          ref: 0,
          value: "300000000",
        },
        primaryMarketId: 0,
        secondaryMarketId: 0,
        otherAddress: signer.address,
        otherAccountId: 0,
        data: [],
      },
    ];
    await soloMarginInstance.connect(signer).operate(accounts, actions);
  });

  it("open short position", async () => {
    let signer: SignerWithAddress = await Impersonate();
    let actions: ActionArgs[] = [];
    let accounts: AccountInfo[] = [];
    const amount = new BigNumber(100);
    const heldMarket = new BigNumber(0); // usdc market
    const owedMarket = new BigNumber(1); // usdc market
    // transfer action
    actions.push({
      actionType: 2,
      accountId: 1,
      amount: {
        sign: false,
        denomination: 0,
        ref: 0,
        value: amount.toString(),
      },
      primaryMarketId: heldMarket.toString(),
      secondaryMarketId: heldMarket.toString(),
      otherAddress: ZERO,
      otherAccountId: 0,
      data: [],
    });
    accounts.push({
      owner: signer.address,
      number: 0,
    },
    {
      owner: signer.address,
      number: 1,
    }
    );

    // const order:ZeroExV2Order = {
    //   type:OrderType.ZeroExV2,
    //   exchangeWrapperAddress:ZeroExV2ExchangeWrapper,
    //   exchangeAddress:ZeroExV2ExchangeWrapper,

    //   expirationTimeSeconds:new BigNumber(Date.now() /1000).plus(new BigNumber(60*60)),
    //   feeRecipientAddress:ZERO,
    //   makerAddress:signer.address,
    //   makerAssetAmount:amount,
    //   makerAssetData:"0x",
    //   makerFee: new BigNumber("0.003"),
    //   salt:new BigNumber(193333),
    //   senderAddress:signer.address,
    //   signature:"",
    //   takerAddress:"",
    //   takerAssetAmount: new BigNumber(0),
    //   takerAssetData:"",
    //   takerFee:new BigNumber(0)
    // }

    const order :TestOrder = {
      type:OrderType.Test,
      exchangeWrapperAddress:ZeroExV2ExchangeWrapper,
      originator:signer.address,
      makerToken:usdcAddress,
      makerAmount:amount,
      takerToken:wethAddress,
      takerAmount:amount,
      allegedTakerAmount:amount,
      desiredMakerAmount:amount
    }

      const orderMapper = new OrderMapper(1);
      const {
        bytes,
        exchangeWrapperAddress,
      }: {
        bytes: number[],
        exchangeWrapperAddress: string,
      } = orderMapper.mapOrder(order);
      const orderData = bytes.map((a :number): number[] => [a]);
      accounts.push({
        owner: signer.address,
        number: 2,
      }
      );

      actions.push({
        actionType:4,
        accountId:2,
        amount:{
          sign:true,
          denomination:0,
          ref:0,
          value:amount.times(-1).toString()
        },
        primaryMarketId:owedMarket.toString(),
        secondaryMarketId:heldMarket.toString(),
        otherAddress:exchangeWrapperAddress,
        otherAccountId:2,
        data:bytes
      })

    await soloMarginInstance.connect(signer).operate(accounts, actions);
  });
});

function stripHexPrefix(input: string) {
  if (input.indexOf("0x") === 0) {
    return input.substr(2);
  }
  return input;
}
function addressesAreEqual(addressOne: string, addressTwo: string): boolean {
  return (
    addressOne.length > 0 &&
    addressTwo.length > 0 &&
    stripHexPrefix(addressOne).toLowerCase() ===
      stripHexPrefix(addressTwo).toLowerCase()
  );
}

function getAccountId(
  accounts: AccountInfo[],
  accountOwner: string,
  accountNumber: number
): { accounts: AccountInfo[]; index: number } {
  const accountInfo: AccountInfo = {
    owner: accountOwner,
    number: accountNumber.toFixed(0),
  };

  const correctIndex = (i: AccountInfo) =>
    addressesAreEqual(i.owner, accountInfo.owner) &&
    i.number === accountInfo.number;

  const index = accounts.findIndex(correctIndex);

  if (index >= 0) {
    return { accounts, index };
  }

  accounts.push(accountInfo);
  return { accounts, index: accounts.length - 1 };
}
