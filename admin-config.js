// Admin Config สำหรับ THBC / MTEC

// ✅ Token & Contract addresses
const THBC_TOKEN_ADDRESS = "0xe8d4687b77B5611eF1828FDa7428034FA12a1Beb";
const MTEC_TOKEN_ADDRESS = "0x2D36AC3c4D4484aC60dcE5f1D4d2B69A826F52A4";
const STAKING_CONTRACT_ADDRESS = "0xe823519CcD5Fc0547Bc3bC498366F791479B2AE7";
const SWAP_CONTRACT_ADDRESS = "0x6FADA34FDEe30aE48a542DF36c6fF5f2f9178F42";

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Staking ABI (แบบเต็มสำหรับ Admin)
const STAKING_ABI = [
  "function apyBasisPoints() view returns (uint256)",
  "function referralBasisPoints() view returns (uint256)",
  "function lockDuration() view returns (uint256)",
  "function owner() view returns (address)",
  "function emergencyWithdraw(address token, uint256 amount, address to) external",
  "function stake(uint256 amount, address referrer) external",
  "function claim() external",
  "function getStake(address user) external view returns (uint256 amount,uint256 startTime,bool claimed,address referrer)",
  "function pendingRewards(address user) external view returns (uint256 stakingReward,uint256 referralReward)",
  "function canClaim(address user) external view returns (bool)",
  "function setParams(uint256 _apyBP, uint256 _refBP, uint256 _lockDurationSec) external"
];

// Swap ABI (จากที่คุณส่ง)
const SWAP_ABI = [
  "function owner() view returns (address)",
  "function previewMtecOut(uint256 thbcAmount) view returns (uint256)",
  "function rateNumerator() view returns (uint256)",
  "function rateDenominator() view returns (uint256)",
  "function setRate(uint256 _num, uint256 _denom) external",
  "function emergencyWithdraw(address token, uint256 amount, address to) external",
  "function thbc() view returns (address)",
  "function mtec() view returns (address)"
];

window.ADMIN_CONFIG = {
  chainId: "0x38",
  thbc: { address: THBC_TOKEN_ADDRESS, abi: ERC20_ABI },
  mtec: { address: MTEC_TOKEN_ADDRESS, abi: ERC20_ABI },
  staking: { address: STAKING_CONTRACT_ADDRESS, abi: STAKING_ABI },
  swap: { address: SWAP_CONTRACT_ADDRESS, abi: SWAP_ABI }
};
