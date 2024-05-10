import fs from "fs";
import { ethers, JsonRpcProvider, FetchRequest, formatEther, formatUnits } from "ethers";
import fetch from "node-fetch";
import { HttpsProxyAgent } from 'https-proxy-agent';
import { config } from './config.js';
import { logger } from './logger/logger.js';


class Memecoin {
    static CONTRACT_ADDRESS = "0xC059A531B4234D05E9ef4ac51028F7E6156E2CCe";
    static CONTRACT_ABI = JSON.parse(fs.readFileSync('./abi/memecoin.json', "utf8"));

    constructor(provider, signer) {
        this.provider = provider;
        this.signer = signer;
        this.contract = new ethers.Contract(Memecoin.CONTRACT_ADDRESS, Memecoin.CONTRACT_ABI, this.signer);
    }

    async unstake(rewardId, amount, proof) {
        await waitForGas();

        const rewards = [
            {
                rewardId,
                amount,
                proof
            }
        ];

        const tx = await this.contract.unstake(
            amount,
            rewards
        );

        const receipt = await tx.wait();
        const hash = receipt.hash;
        const weiNetworkFee = receipt.gasUsed * receipt.gasPrice;
        const ethNetworkFee = parseFloat(formatEther(weiNetworkFee.toString()));

        return [ hash, ethNetworkFee ];
    }
};


const waitForGas = async () => {
    // waiting for gas without proxy, default provider
    const mainnetProvider = new JsonRpcProvider(config.ethRpc);
    let currentMaxGas = config.gasPrices.startMainnetGwei;

    const timestampShift = config.gasPrices.delayMinutes * 60 * 1000 // minutes to miliseconds
    let nextCurrentMaxGasIncrease = Date.now() + timestampShift;

    logger.info(`Waiting for gas...`);
    while(true) {
        if ((Date.now() >= nextCurrentMaxGasIncrease) && (config.gasPrices.step !== 0) && (currentMaxGas < config.gasPrices.maxMainnetGwei)) {
            logger.info(`Increasing max gas ${currentMaxGas} -> ${currentMaxGas + config.gasPrices.step} GWEI`);
            currentMaxGas = currentMaxGas + config.gasPrices.step;
            nextCurrentMaxGasIncrease = Date.now() + timestampShift;
        }
        
        const feeData = await mainnetProvider.getFeeData();
        const gasPriceGwei = parseFloat(formatUnits(feeData.gasPrice.toString(), "gwei"));

        if (gasPriceGwei <= currentMaxGas) {
            logger.debug(`current gas is ${gasPriceGwei.toFixed(1)}, my current max is ${currentMaxGas}`);
            logger.info(`gas ok, proceeding`);
            return;
        } else {
            logger.debug(`current gas is ${gasPriceGwei.toFixed(1)}, my current max is ${currentMaxGas}, waiting...`);
            await sleep(randInt(30, 60));
        }
    }
};


const getRewardInfo = async (address, proxy) => {
    const url = `https://memestaking-api.stakeland.com/wallet/info/${address}`;
    const settings = {
        method: 'GET',
        timeout: 5000,
        headers: {},
    };

    if (proxy) {
        const proxyAgent = new HttpsProxyAgent(proxy);
        settings.agent = proxyAgent;
    }

    const response = await fetch(url, settings);
    if (response.status !== 200) {
		throw Error(`Failed to get reward info: ${JSON.stringify(await response.json())})`);
	}

    const data = await response.json();

    if (data.rewards.length !== 1) {
        if (data.rewards.length === 0) {
            throw Error(`No any rewards`);
        } else {
            throw Error(`There are several rewards, please check manually`);
        }
    }

    if (data.rewards[0].redeemedAt !== 0) {
		throw Error(`Reward already redeemed at ${data.rewards[0].redeemedAt}`);
    }

    if (data.rewards[0].amount === "0") {
        throw Error(`Reward amount is 0`);
    }

    return [ data.rewards[0].rewardId, data.rewards[0].amount, data.rewards[0].proof ];
};


const shuffleArray = (array) => {
	return array.sort(() => Math.random() - 0.5);
};


const sleep = (sec) => {
	return new Promise(resolve => setTimeout(resolve, sec * 1000));
};


const randInt = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1) + min);
};


const generateProviderAndSigner = (secret, proxy) => {
    let provider;

    if (proxy) {
        const fetchRequest = new FetchRequest(config.ethRpc);
        fetchRequest.getUrlFunc = FetchRequest.createGetUrlFunc({agent: new HttpsProxyAgent(proxy)});
        provider = new JsonRpcProvider(fetchRequest);
    } else {
        provider = new JsonRpcProvider(config.ethRpc);
    }

    const signer = new ethers.Wallet(secret, provider);
    return [ provider, signer ];
};


const start = async () => {
    let wallets = fs.readFileSync("wallets.txt", 'utf8').toString().replace(/\r\n/g, '\n').split('\n').filter(n => n);
    if (config.shuffleWallets) {
        wallets = shuffleArray(wallets);
    }

    for (const wallet of wallets) {
        const [ name, address, secret, proxy ] = wallet.split("|");
        logger.info(`${name} - checking wallet`);

        try {
            const [ rewardId, amount, proof ] = await getRewardInfo(address, proxy);
            logger.debug(`Amount: ${amount}`);

            logger.info(`${name} - going to unstake ~ ${amount / 10**18} MEME`);

            const [ provider, signer ] = generateProviderAndSigner(secret, proxy);
            const memecoin = new Memecoin(provider, signer);
            const [ hash, ethNetworkFee ] = await memecoin.unstake(rewardId, amount, proof);
            logger.info(`${name} - success, hash: ${hash}, fee: ${ethNetworkFee} ETH`);
        } catch (e) {
            logger.error(`${name} - ${e.message}`);
        }

        const delay = randInt(config.minDelaySec, config.maxDelaySec);
        logger.debug(`Sleeping ${delay / 60} minutes`);
        await sleep(delay);
    }
};

start();


