const { expect } = require("chai");
const { waffle } = require("hardhat");

describe("Swap Contract deployment", function () {
  let SwapContract;
  let hardhatSwapContract;

  let EURFIX;
  let hardhatEURFIX;
  let USDFLOAT;
  let hardhatUSDFLOAT;
  let DAI;
  let hardhatDAI;

  let owner;
  let minter;
  let redeemer;
  let addrs;

  // test data. Use BigNumber to avoid overflow
  const totalDAISupply = ethers.BigNumber.from("1000000000000000000000"); // 1000
  const initialContractBalance = ethers.BigNumber.from("100000000000000000000"); // 100
  const ownerDAISupply = totalDAISupply.sub(initialContractBalance);
  const approvedAmount = ethers.BigNumber.from("100000000000000000000"); // 100

  beforeEach(async () => {

    // main swap contract
    SwapContract = await ethers.getContractFactory("SwapContract");
    hardhatSwapContract = await SwapContract.deploy();
    await hardhatSwapContract.deployed();
  
    // get addresses to interact
    [owner, minter, redeemer, ...addrs] = await ethers.getSigners();

    // launch auxillary tokens and connect to main contract
    EURFIX = await ethers.getContractFactory("EURFIX");
    hardhatEURFIX = await EURFIX.deploy(hardhatSwapContract.address);
    await hardhatEURFIX.deployed();

    USDFLOAT = await ethers.getContractFactory("USDFLOAT");
    hardhatUSDFLOAT = await USDFLOAT.deploy(hardhatSwapContract.address);
    await hardhatUSDFLOAT.deployed();

    DAI = await ethers.getContractFactory("DAI");
    hardhatDAI = await DAI.deploy(totalDAISupply);
    await hardhatDAI.deployed();

    // give derivative contract address to main address
    await hardhatSwapContract.set_EURFIX_address(hardhatEURFIX.address);
    await hardhatSwapContract.set_USDFLOAT_address(hardhatUSDFLOAT.address);
    await hardhatSwapContract.set_Dai_address(hardhatDAI.address);

    // send initial supply of Dai to the pool
    await hardhatDAI.transfer(hardhatSwapContract.address, initialContractBalance);

  });

  describe("Inheritance", function () {
    it("Can access the price oracles from Price Consumer Contract", async function () {
      expect(await hardhatSwapContract.getDAIPrice()).not.be.null;
    });
  });



  describe("Deployment", function () {
    it("Should give Swap Contract the MINTER_ROLE", async function() {
      // Deployer address should receive the MINTER_ROLE
      const minter_role = await hardhatEURFIX.MINTER_ROLE();
      expect(await hardhatEURFIX.hasRole(minter_role, hardhatSwapContract.address)).to.be.true;
    });
    it("Should set the correct (EURFIX) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await hardhatSwapContract.EURFIX_address()).to.equal(hardhatEURFIX.address);
    });
    it("Should set the correct (USDFLOAT) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await hardhatSwapContract.USDFLOAT_address()).to.equal(hardhatUSDFLOAT.address);
    });
    it("Should set the correct (DAI) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await hardhatSwapContract.Dai_address()).to.equal(hardhatDAI.address);
    });
  });

});

