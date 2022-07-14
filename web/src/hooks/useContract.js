import { governanceContracts } from '../constants/addresses'

export const useContract = (contract, address, web3) => {
    const con = new web3.eth.Contract(
                    contract.abi,
                    address
                )

    return [ con ]
}