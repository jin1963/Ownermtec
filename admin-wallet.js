window.AdminWallet = (function () {
  const { ethers } = window;
  const CONFIG = window.ADMIN_CONFIG;

  let provider = null;
  let signer = null;
  let address = null;

  async function connectWallet() {
    if (!window.ethereum) {
      AdminUtils.showToast("ไม่พบกระเป๋า Web3 (MetaMask / Bitget)");
      return null;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    const accs = await provider.send("eth_requestAccounts", []);
    address = accs[0];
    signer = provider.getSigner();

    await ensureCorrectNetwork();

    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());

    return address;
  }

  async function ensureCorrectNetwork() {
    const network = await provider.getNetwork();
    const currentChainIdHex = "0x" + network.chainId.toString(16);
    if (currentChainIdHex !== CONFIG.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CONFIG.chainId }]
        });
      } catch (e) {
        AdminUtils.showToast("กรุณาเปลี่ยนเป็น BNB Smart Chain (BSC)");
        throw e;
      }
    }
  }

  function getAddress() {
    return address;
  }

  function isConnected() {
    return !!address;
  }

  async function getContract(configEntry) {
    if (!provider) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.Contract(
      configEntry.address,
      configEntry.abi,
      signer || provider
    );
  }

  async function getThbc() {
    return getContract(CONFIG.thbc);
  }

  async function getMtec() {
    return getContract(CONFIG.mtec);
  }

  async function getStaking() {
    return getContract(CONFIG.staking);
  }

  async function getSwap() {
    return getContract(CONFIG.swap);
  }

  return {
    connectWallet,
    getAddress,
    isConnected,
    getThbc,
    getMtec,
    getStaking,
    getSwap
  };
})();
