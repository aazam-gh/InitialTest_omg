const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AssessmentToken', function () {
  async function deployToken() {
    const [owner, recipient, spender] = await ethers.getSigners();
    const Token = await ethers.getContractFactory('AssessmentToken');
    const token = await Token.deploy(1_000_000n);
    return { token, owner, recipient, spender };
  }

  it('mints the full fixed supply to the deployer', async function () {
    const { token, owner } = await deployToken();
    expect(await token.totalSupply()).to.equal(1_000_000n * 10n ** 18n);
    expect(await token.balanceOf(owner.address)).to.equal(await token.totalSupply());
  });

  it('transfers tokens', async function () {
    const { token, recipient } = await deployToken();
    await token.transfer(recipient.address, 125n);
    expect(await token.balanceOf(recipient.address)).to.equal(125n);
  });

  it('supports approval and delegated transfer', async function () {
    const { token, owner, recipient, spender } = await deployToken();
    await token.approve(spender.address, 200n);
    await token.connect(spender).transferFrom(owner.address, recipient.address, 75n);
    expect(await token.balanceOf(recipient.address)).to.equal(75n);
    expect(await token.allowance(owner.address, spender.address)).to.equal(125n);
  });
});
