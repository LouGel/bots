import { ethers } from "ethers";
const MAX = ethers.BigNumber.from(2).pow(256).sub(1);
const wait = (ms: any) => new Promise((r) => setTimeout(r, ms));

const addresses = {
  USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
  LAB: "0x96b3d7a2749A292D74d3C2B6AF101bE76fcF1b94",
  BUYBACK: "0xad8baE880F3deec52f85325d1B97Fedcb26A3100",
};
const wallets = [
  "0xFe62aAFcf1F545B0efE5b85ED502E291d8d7De3D",
  "0x12477830EDeEFBd3a85ca77f50B461fff09063da",
  "0x01CB635E44A6778e1f8281e1f694Df53CBB64557",
  "0xcB5Fb9561c1B8F3038c53b499e7765b6fd2C153e",
  "0x164797280df9e1BFB76BEc2A13Dc02dc25Ea6d72",
];
/**
 * RENTRE UN DES TERME EN PARAMETRE ex: ts-node buyback.ts KEPKEP
 */
const APIKEYS = {
  KEPKEP: "9Iw_ff_dT6xDnSuuqK9BW_tFjk4KZ_Pa",
  BEGUIN: "7BHesrR325dcZuvFaEhCg3zzqxvPjppJ,",
  BISBIS: "ZzLUlM-A_ur0rbvG6iXGphF5M5TOY4a7",
  EMILIO: "eLmoDCt2uZPC-SQ9uDXdTGbIgvMT3Rxo",
};
const getKeys = (val: string) => {
  if (val === "KEPKEP") return APIKEYS.KEPKEP;
  else if (val === "BEGUIN") return APIKEYS.BEGUIN;
  else if (val === "BISBIS") return APIKEYS.BISBIS;
  else if (val === "EMILIO") return APIKEYS.EMILIO;
  else return null;
};
const network = ethers.providers.getNetwork("arbitrum");

const erc20Abi = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address _owner) public view returns (uint256 balance)",
  "function transfer(address _to, uint256 _value) public returns (bool success)",
  "function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)",
  "function approve(address _spender, uint256 _value) public returns (bool success)",
  "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
];

const buybackAbi = [
  "function isOpenned() external view returns (bool)",
  "function selllab(uint256 amountToSell) external",
];
const format = ethers.utils.formatEther;
const parse = ethers.utils.parseEther;

async function main() {
  if (process.argv.length < 4) {
    console.log("No sufficients argv");
    return 1;
  }

  const apiToUse = getKeys(process.argv[2]);
  const wallet = new ethers.Wallet(process.argv[3]);
  const httpsProvider = new ethers.providers.AlchemyProvider(network, apiToUse);
  const signer = wallet.connect(httpsProvider);

  if (!apiToUse) {
    console.log("ERRRRROR WRONG API NAME !!!!! ");
    return 1;
  } else if (!wallets.includes(signer?.address)) {
    console.log(
      "!!!!!!! Not a good wallet do nothing  if it's done on purpose !!"
    );
  }

  console.log(
    "Starting bot with this wallet --> !!!!!!!!",
    signer.address,
    "!!!!!!!!!!!!!!"
  );
  const lab = new ethers.Contract(addresses.LAB, erc20Abi, signer);
  const usdc = new ethers.Contract(addresses.USDC, erc20Abi, signer);
  const buyback = new ethers.Contract(addresses.BUYBACK, buybackAbi, signer);
  const lol = ethers.utils.formatEther(
    await lab.allowance(signer.address, addresses.BUYBACK)
  );
  if (!parseInt(lol)) {
    console.log("No allowance");
    await lab.approve(addresses.BUYBACK, MAX);
  } else {
    console.log("Already approved");
  }
  const labBalanceRaw = await lab.balanceOf(signer.address);
  const labBalance = format(labBalanceRaw);
  const usdcBalanceRaw = await usdc.balanceOf(signer.address);
  const usdcBalance = format(usdcBalanceRaw);
  console.log("Balance of Lab before : ", labBalance);
  console.log("Balance of Usdc before : ", usdcBalance);

  let finished = false;
  while (!finished) {
    await wait(200);
    if (await buyback.isOpenned()) {
      const tx = await buyback.selllab(labBalanceRaw, { gasPrice: 1e10 });
      tx.wait();
      finished = true;
    } else console.log("Not opened");
  }

  const labBalanceAfter = format(await lab.balanceOf(signer.address));
  const usdcBalanceAfter = format(await usdc.balanceOf(signer.address));
  console.log("Balance of Lab after : ", labBalanceAfter);
  console.log("Balance of Usdc after : ", usdcBalanceAfter);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
