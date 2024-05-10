export const config = {
    shuffleWallets: true,
    minDelaySec: 10,
    maxDelaySec: 20,
    ethRpc: "https://rpc.ankr.com/eth",

    gasPrices: {
		startMainnetGwei: 5,
		step: 1,
		delayMinutes: 2,
		maxMainnetGwei: 10
	},
};