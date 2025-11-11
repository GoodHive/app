// thirdwebClient.ts
import { createThirdwebClient } from "thirdweb";

export const thirdwebClient = createThirdwebClient({
  clientId: "4cbd356d64bab5853980d03c39c0a10b", // Get from your thirdweb dashboard
  // Add config to bypass gas station API
  config: {
    rpc: {
      // Skip gas station API and use fixed gas prices
      skipGasStationFetch: true,
    },
  },
});
