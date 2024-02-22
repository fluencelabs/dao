import supportedChains from '../constants/chains'
const { REACT_APP_INFURA_KEY } = process.env

export const hideString = (str) => {
    return typeof(str) === 'string' ? `${str.slice(0, 11)}..${str.slice(-3)}` : ''
}

export const infuraUrlFactory = (network) => {
    switch (network) {
        case 'kovan':
            return `https://kovan.infura.io/v3/${REACT_APP_INFURA_KEY}`
        
        case 'rinkeby':
            return `https://rinkeby.infura.io/v3/${REACT_APP_INFURA_KEY}`
    
        default:
            return `https://mainnet.infura.io/v3/${REACT_APP_INFURA_KEY}`
    }
}

export const roundNumber = (num) => {
    if (num >= 1000) {
        return String(`${num / 1000} K`);
    }
    
    return num;
}

export function getChainData(chainId) {
    if (!chainId) {
        return null
    }
    const chainData = supportedChains.filter(
        (chain) => chain.chain_id === chainId
    )[0]

    if (!chainData) {
        throw new Error('ChainId missing or not supported')
    }

    const { REACT_APP_INFURA_KEY: API_KEY } = process.env

    if (
        chainData.rpc_url.includes('infura.io') &&
        chainData.rpc_url.includes('%API_KEY%') &&
        API_KEY
    ) {
        const rpcUrl = chainData.rpc_url.replace('%API_KEY%', API_KEY)

        return {
            ...chainData,
            rpc_url: rpcUrl,
        }
    }

    return chainData
}

export function ellipseAddress(address = '', width = 10) {
    if (!address) {
        return ''
    }
    return `${address.slice(0, width)}...${address.slice(-width)}`
}