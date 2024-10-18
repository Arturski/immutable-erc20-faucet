import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("SimpleSharkSaleDummy", function () {
  let SimpleSharkSaleDummy: Contract;
  let PaymentToken: Contract;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const PaymentTokenFactory = await ethers.getContractFactory("ERC20Mock");
    PaymentToken = await PaymentTokenFactory.deploy("MockToken", "MTK", 18, ethers.utils.parseUnits("1000", 18));
    await PaymentToken.deployed();

    const SimpleSharkSaleDummyFactory = await ethers.getContractFactory("SimpleSharkSaleDummy");
    [owner, addr1, addr2] = await ethers.getSigners();

    SimpleSharkSaleDummy = await SimpleSharkSaleDummyFactory.deploy(PaymentToken.address, owner.address);
    await SimpleSharkSaleDummy.deployed();

    // Distribute some tokens to addr1 for testing
    await PaymentToken.transfer(addr1.address, ethers.utils.parseUnits("100", 18));
  });

  describe("Deployment", function () {
    it("Should set the right payment token and recipient", async function () {
      expect(await SimpleSharkSaleDummy.paymentToken()).to.equal(PaymentToken.address);
      expect(await SimpleSharkSaleDummy.paymentRecipient()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint successfully when payment is made", async function () {
      await PaymentToken.connect(addr1).approve(SimpleSharkSaleDummy.address, ethers.utils.parseUnits("1", 18));
      await expect(SimpleSharkSaleDummy.connect(addr1).mint(1))
        .to.emit(SimpleSharkSaleDummy, "Minted")
        .withArgs(addr1.address, 1);
    });

    it("Should fail to mint if payment is not made", async function () {
      await expect(SimpleSharkSaleDummy.connect(addr1).mint(1)).to.be.revertedWith("Payment failed");
    });

    it("Should transfer the correct payment amount to the recipient", async function () {
      await PaymentToken.connect(addr1).approve(SimpleSharkSaleDummy.address, ethers.utils.parseUnits("1", 18));
      await SimpleSharkSaleDummy.connect(addr1).mint(1);
      expect(await PaymentToken.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("1", 18));
    });

    it("Should fail to mint if not enough tokens approved", async function () {
      await PaymentToken.connect(addr1).approve(SimpleSharkSaleDummy.address, ethers.utils.parseUnits("0.5", 18));
      await expect(SimpleSharkSaleDummy.connect(addr1).mint(1)).to.be.revertedWith("Payment failed");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set a new payment recipient", async function () {
      await SimpleSharkSaleDummy.connect(owner).setPaymentRecipient(addr2.address);
      expect(await SimpleSharkSaleDummy.paymentRecipient()).to.equal(addr2.address);
    });

    it("Should allow owner to set a new payment token", async function () {
      const NewPaymentTokenFactory = await ethers.getContractFactory("ERC20Mock");
      const NewPaymentToken = await NewPaymentTokenFactory.deploy("NewMockToken", "NMT", 18, ethers.utils.parseUnits("1000", 18));
      await NewPaymentToken.deployed();
      await SimpleSharkSaleDummy.connect(owner).setPaymentToken(NewPaymentToken.address);
      expect(await SimpleSharkSaleDummy.paymentToken()).to.equal(NewPaymentToken.address);
    });

    it("Should fail if non-owner tries to set payment recipient", async function () {
      await expect(SimpleSharkSaleDummy.connect(addr1).setPaymentRecipient(addr2.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if non-owner tries to set payment token", async function () {
      await expect(SimpleSharkSaleDummy.connect(addr1).setPaymentToken(PaymentToken.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
