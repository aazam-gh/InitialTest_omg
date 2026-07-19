const { ethers } = require('hardhat');

async function main() {
  const initialSupply = process.env.INITIAL_TOKEN_SUPPLY || '1000000';
  const AssessmentToken = await ethers.getContractFactory('AssessmentToken');
  const token = await AssessmentToken.deploy(initialSupply);
  await token.waitForDeployment();

  console.log('AssessmentToken deployed to:', await token.getAddress());
  console.log('Initial whole-token supply:', initialSupply);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
