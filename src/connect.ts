import Web3 from 'web3';
import { AbiItem, hexToNumber } from 'web3-utils';
import detectEthereumProvider from '@metamask/detect-provider';
import { signatureVerify } from '@polkadot/util-crypto'
const ethUtil = require('ethereumjs-util')

export const ALITH_PRIVKEY = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133";
const testMsg = "hello world but a lil bit longer"

type Address = string;
export async function connectMetaMask(
	onAccountsChanged: (accounts: Address[]) => void,
	onNetworkChanged: (networkId: number) => void,
	toAlpha?: boolean
) {
	let isConnected: boolean = false
	let web3: Web3
	let networkId: number = 0
	let accountsRead: string[] = ["0x0"]
	if ((window as { [key: string]: any }).ethereum) {
		console.log('Last updated: 04/27/21');
		// const { ethereum } = window as { [key: string]: any };
		const provider: any = await detectEthereumProvider({ mustBeMetaMask: true });
		console.log('PROVIDER', provider);
		if (provider && provider.isMetaMask) {
			try {
				// initiate web3
				web3 = new Web3(provider);
				// this.web3 = web3;

				// Enable MetaMask accounts
				accountsRead = await provider.request({ method: 'eth_requestAccounts' });
				// const accountsRead = await web3.eth.getAccounts();
				if (toAlpha) {
					await provider.request({
						method: 'wallet_addEthereumChain',
						params: [
							{
								chainId: '0x507',
								chainName: 'Moonbase Alpha',
								nativeCurrency: {
									name: 'DEV',
									symbol: 'DEV',
									decimals: 18,
								},
								rpcUrls: ['https://rpc.testnet.moonbeam.network'],
								blockExplorerUrls: ['https://moonbase-blockscout.testnet.moonbeam.network/'],
							},
						],
					});
				}

				if (onAccountsChanged) {
					onAccountsChanged(accountsRead);
					provider.on('accountsChanged', async (accounts: string[]) => {
						if (accounts.length > 0) {
							const accountsReadAgain = await provider.request({ method: 'eth_accounts' });
							// const accountsReadAgain = await web3.eth.getAccounts();
							console.log('accountsChanged', accountsReadAgain);
							onAccountsChanged(accountsReadAgain);
						} else {
							window.location.reload();
						}
					});

					provider.on('chainChanged', async (chainId: string) => {
						console.log('chainChanged', chainId, hexToNumber(chainId));
						onNetworkChanged(Number(chainId));
						await connectMetaMask(onAccountsChanged, onNetworkChanged);
					});
				}
				isConnected = true;
				networkId = await web3.eth.net.getId();
				console.log("ok")
				const msgHashHex =ethUtil.bufferToHex(Buffer.from(testMsg)) //ethUtil.bufferToHex(ethUtil.keccak(Buffer.from(testMsg)))
				const signedMsg = await provider.request({ method: 'eth_sign', params: [accountsRead[0], msgHashHex] });
				console.log("SIGNED", signedMsg)
				
				console.log('verify', signatureVerify(testMsg, signedMsg, accountsRead[0]))

				const r = ethUtil.toBuffer(signedMsg.slice(0, 66))
				const s = ethUtil.toBuffer(`0x${signedMsg.slice(66, 130)}`)
				const v = ethUtil.bufferToInt(ethUtil.toBuffer(`0x${signedMsg.slice(130, 132)}`))
				const m = ethUtil.toBuffer(msgHashHex)
				const pub = ethUtil.ecrecover(m, v, r, s)
				const adr = `0x${ethUtil.pubToAddress(pub).toString('hex')}`
				console.log("ADDRESS", adr)
			} catch (e) {
				if (e.code !== 4001) {
					throw new Error(e.message);
				}
			}
		} else {
			throw new Error('Other ethereum wallet did not support.');
		}
	}
	return { isConnected, networkId, accounts: accountsRead };
}