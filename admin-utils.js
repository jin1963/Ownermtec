window.AdminUtils = (function () {
  const { ethers } = window;

  function shortenAddress(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  function formatNumber(num, decimals = 4) {
    if (num === null || num === undefined) return "-";
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  }

  function formatUnits(bn, decimals) {
    return ethers.utils.formatUnits(bn || 0, decimals);
  }

  function showToast(msg) {
    alert(msg);
  }

  return {
    shortenAddress,
    formatNumber,
    formatUnits,
    showToast
  };
})();
