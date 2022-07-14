import Button from '../Button/Button'
import { useWeb3Connection } from '../../hooks/useWeb3Connection'
//import { getChainData } from '../../utils'

const ConnectWallet = () => {

    const { connect, disconnect, web3Provider } = useWeb3Connection()

    return (
        <>
            {web3Provider ? (
                <Button callback={disconnect} text='Disconnect'/>
            ) : (
                <Button callback={connect} text='Connect a wallet'/>
            )}
        </>
  )
}

export default ConnectWallet