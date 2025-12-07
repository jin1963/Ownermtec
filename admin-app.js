window.addEventListener("DOMContentLoaded", () => {
  const btnConnect = document.getElementById("btnConnect");
  const walletAddressLabel = document.getElementById("walletAddress");

  const notOwnerSection = document.getElementById("notOwnerSection");
  const adminSection = document.getElementById("adminSection");
  const swapSection = document.getElementById("swapSection");
  const balancesSection = document.getElementById("balancesSection");

  const stakingOwnerLabel = document.getElementById("stakingOwnerLabel");
  const swapOwnerLabel = document.getElementById("swapOwnerLabel");

  const btnUpdateStakingParams = document.getElementById("btnUpdateStakingParams");
  const btnUpdateRate = document.getElementById("btnUpdateRate");
  const btnWithdrawStakingMtec = document.getElementById("btnWithdrawStakingMtec");
  const btnWithdrawSwapThbc = document.getElementById("btnWithdrawSwapThbc");
  const btnWithdrawSwapMtec = document.getElementById("btnWithdrawSwapMtec");

  btnConnect.addEventListener("click", onConnect);

  async function onConnect() {
    try {
      const addr = await AdminWallet.connectWallet();
      if (!addr) return;

      walletAddressLabel.textContent = AdminUtils.shortenAddress(addr);

      await checkOwnerAndInit();
    } catch (e) {
      console.error(e);
      AdminUtils.showToast("เชื่อมต่อกระเป๋าไม่สำเร็จ");
    }
  }

  async function checkOwnerAndInit() {
    const staking = await AdminWallet.getStaking();
    const swap = await AdminWallet.getSwap();

    const [stakingOwner, swapOwner] = await Promise.all([
      staking.owner(),
      swap.owner()
    ]);

    const myAddr = AdminWallet.getAddress();
    const isOwner =
      myAddr &&
      (myAddr.toLowerCase() === stakingOwner.toLowerCase() ||
        myAddr.toLowerCase() === swapOwner.toLowerCase());

    stakingOwnerLabel.textContent = AdminUtils.shortenAddress(stakingOwner);
    swapOwnerLabel.textContent = AdminUtils.shortenAddress(swapOwner);

    if (!isOwner) {
      notOwnerSection.style.display = "block";
      adminSection.style.display = "none";
      swapSection.style.display = "none";
      balancesSection.style.display = "none";
      return;
    }

    // Owner เท่านั้นที่เห็น
    notOwnerSection.style.display = "none";
    adminSection.style.display = "block";
    swapSection.style.display = "block";
    balancesSection.style.display = "block";

    // init data
    await Promise.all([
      loadStakingConfig(),
      loadSwapConfig(),
      loadBalances()
    ]);

    // bind admin buttons
    btnUpdateStakingParams.addEventListener("click", updateStakingParams);
    btnUpdateRate.addEventListener("click", updateSwapRate);
    btnWithdrawStakingMtec.addEventListener("click", withdrawStakingMtec);
    btnWithdrawSwapThbc.addEventListener("click", withdrawSwapThbc);
    btnWithdrawSwapMtec.addEventListener("click", withdrawSwapMtec);
  }

  // ---- Load info ----

  async function loadStakingConfig() {
    const staking = await AdminWallet.getStaking();
    const [apyBP, refBP, lockSec] = await Promise.all([
      staking.apyBasisPoints(),
      staking.referralBasisPoints(),
      staking.lockDuration()
    ]);

    const apyPercent = Number(apyBP) / 100;
    const refPercent = Number(refBP) / 100;
    const lockDays = Number(lockSec) / 86400;

    document.getElementById("infoApy").textContent = apyPercent.toFixed(2) + " %";
    document.getElementById("infoReferral").textContent = refPercent.toFixed(2) + " %";
    document.getElementById("infoLockDays").textContent = lockDays.toFixed(2) + " วัน";
  }

  async function loadSwapConfig() {
    const swap = await AdminWallet.getSwap();
    const [num, den] = await Promise.all([
      swap.rateNumerator(),
      swap.rateDenominator()
    ]);

    document.getElementById("infoRateNum").textContent = num.toString();
    document.getElementById("infoRateDen").textContent = den.toString();

    let human = "-";
    try {
      // ถ้าคุณตั้งค่าเป็น 1e18 / 1e18 = 1
      if (!den.isZero()) {
        const ratio = num.mul(10000).div(den); // scale 1e4
        const val = ratio.toNumber() / 10000;
        human = `1 THBC ≈ ${val} MTEC`;
      }
    } catch (_) {}

    document.getElementById("infoRateHuman").textContent = human;
  }

  async function loadBalances() {
    const staking = await AdminWallet.getStaking();
    const swap = await AdminWallet.getSwap();
    const thbc = await AdminWallet.getThbc();
    const mtec = await AdminWallet.getMtec();

    const [thbcDec, mtecDec] = await Promise.all([
      thbc.decimals(),
      mtec.decimals()
    ]);

    const [
      stakingMtecBal,
      swapThbcBal,
      swapMtecBal
    ] = await Promise.all([
      mtec.balanceOf(window.ADMIN_CONFIG.staking.address),
      thbc.balanceOf(window.ADMIN_CONFIG.swap.address),
      mtec.balanceOf(window.ADMIN_CONFIG.swap.address)
    ]);

    document.getElementById("infoStakingMtec").textContent =
      AdminUtils.formatNumber(AdminUtils.formatUnits(stakingMtecBal, mtecDec), 6) + " MTEC";

    document.getElementById("infoSwapThbc").textContent =
      AdminUtils.formatNumber(AdminUtils.formatUnits(swapThbcBal, thbcDec), 6) + " THBC";

    document.getElementById("infoSwapMtec").textContent =
      AdminUtils.formatNumber(AdminUtils.formatUnits(swapMtecBal, mtecDec), 6) + " MTEC";
  }

  // ---- Actions ----

  async function updateStakingParams() {
    try {
      const apyInput = document.getElementById("inputApy").value.trim();
      const refInput = document.getElementById("inputReferral").value.trim();
      const lockDaysInput = document.getElementById("inputLockDays").value.trim();

      if (!apyInput || !refInput || !lockDaysInput) {
        AdminUtils.showToast("กรุณากรอก APY, Referral และ Lock Days ให้ครบ");
        return;
      }

      const apyBP = Math.round(parseFloat(apyInput) * 100); // 30% => 3000
      const refBP = Math.round(parseFloat(refInput) * 100); // 10% => 1000
      const lockSec = Math.round(parseFloat(lockDaysInput) * 86400);

      const staking = await AdminWallet.getStaking();
      AdminUtils.showToast("กำลังส่งธุรกรรม setParams...");
      const tx = await staking.setParams(apyBP, refBP, lockSec);
      await tx.wait();
      AdminUtils.showToast("อัปเดต Staking Params สำเร็จ ✅");

      await loadStakingConfig();
    } catch (e) {
      console.error(e);
      AdminUtils.showToast("อัปเดต Staking Params ไม่สำเร็จ / ถูกยกเลิก");
    }
  }

  async function updateSwapRate() {
    try {
      const numStr = document.getElementById("inputRateNum").value.trim();
      const denStr = document.getElementById("inputRateDen").value.trim();

      if (!numStr || !denStr) {
        AdminUtils.showToast("กรุณากรอก Numerator และ Denominator ให้ครบ");
        return;
      }

      const num = window.ethers.BigNumber.from(numStr);
      const den = window.ethers.BigNumber.from(denStr);
      if (den.isZero()) {
        AdminUtils.showToast("Denominator ห้ามเป็น 0");
        return;
      }

      const swap = await AdminWallet.getSwap();
      AdminUtils.showToast("กำลังส่งธุรกรรม setRate...");
      const tx = await swap.setRate(num, den);
      await tx.wait();
      AdminUtils.showToast("อัปเดต Swap Rate สำเร็จ ✅");

      await loadSwapConfig();
    } catch (e) {
      console.error(e);
      AdminUtils.showToast("อัปเดต Swap Rate ไม่สำเร็จ / ถูกยกเลิก");
    }
  }

  async function withdrawStakingMtec() {
    try {
      const staking = await AdminWallet.getStaking();
      const mtec = await AdminWallet.getMtec();

      const [dec, bal] = await Promise.all([
        mtec.decimals(),
        mtec.balanceOf(window.ADMIN_CONFIG.staking.address)
      ]);

      if (bal.isZero()) {
        AdminUtils.showToast("ใน Staking Contract ไม่มี MTEC คงเหลือ");
        return;
      }

      const ownerAddr = await staking.owner();

      AdminUtils.showToast("กำลังถอน MTEC ทั้งหมดจาก Staking...");
      const tx = await staking.emergencyWithdraw(
        window.ADMIN_CONFIG.mtec.address,
        bal,
        ownerAddr
      );
      await tx.wait();
      AdminUtils.showToast("ถอน MTEC จาก Staking สำเร็จ ✅");

      await loadBalances();
    } catch (e) {
      console.error(e);
      AdminUtils.showToast("ถอน MTEC จาก Staking ไม่สำเร็จ / ถูกยกเลิก");
    }
  }

  async function withdrawSwapThbc() {
    try {
      const swap = await AdminWallet.getSwap();
      const thbc = await AdminWallet.getThbc();

      const [dec, bal] = await Promise.all([
        thbc.decimals(),
        thbc.balanceOf(window.ADMIN_CONFIG.swap.address)
      ]);

      if (bal.isZero()) {
        AdminUtils.showToast("ใน Swap Contract ไม่มี THBC คงเหลือ");
        return;
      }

      const ownerAddr = await swap.owner();
      AdminUtils.showToast("กำลังถอน THBC ทั้งหมดจาก Swap...");
      const tx = await swap.emergencyWithdraw(
        window.ADMIN_CONFIG.thbc.address,
        bal,
        ownerAddr
      );
      await tx.wait();
      AdminUtils.showToast("ถอน THBC จาก Swap สำเร็จ ✅");

      await loadBalances();
    } catch (e) {
      console.error(e);
      AdminUtils.showToast("ถอน THBC จาก Swap ไม่สำเร็จ / ถูกยกเลิก");
    }
  }

  async function withdrawSwapMtec() {
    try {
      const swap = await AdminWallet.getSwap();
      const mtec = await AdminWallet.getMtec();

      const [dec, bal] = await Promise.all([
        mtec.decimals(),
        mtec.balanceOf(window.ADMIN_CONFIG.swap.address)
      ]);

      if (bal.isZero()) {
        AdminUtils.showToast("ใน Swap Contract ไม่มี MTEC คงเหลือ");
        return;
      }

      const ownerAddr = await swap.owner();
      AdminUtils.showToast("กำลังถอน MTEC ทั้งหมดจาก Swap...");
      const tx = await swap.emergencyWithdraw(
        window.ADMIN_CONFIG.mtec.address,
        bal,
        ownerAddr
      );
      await tx.wait();
      AdminUtils.showToast("ถอน MTEC จาก Swap สำเร็จ ✅");

      await loadBalances();
    } catch (e) {
      console.error(e);
      AdminUtils.showToast("ถอน MTEC จาก Swap ไม่สำเร็จ / ถูกยกเลิก");
    }
  }
});
