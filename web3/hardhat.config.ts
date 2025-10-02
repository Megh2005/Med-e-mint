import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();


const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "fuji",
  networks: {
    fuji: {
      url: process.env.FUJI_RPC || "",
      chainId: 43113,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },

};

export default config;
