# Fluence DAO Contracts

This is solidity contracts for Fluence DAO. For DAO it uses OpenZeppelin contracts with modifications.

## Feature
- timelock DAO governor based on **TimelockControllerUpgradeable** and **GovernorUpgradeable** (OpenZeppelin contracts).
- everyone could **execute a proposal**
- **veto power**: Finally CANCELLER_ROLE is granted to `Governor` contract & `Fluence Multisig`. Veto could be applied after proposal is queued to execute (before it is executed).
- LBP Vesting with moving funds after specified time to Uniswap (TODO: write more precisely)
- 3 Vesting Contract with Delayed Start:
  - 2 to use different configs between Fluence team and investors
  - 1 with Voting
- [0003_DevRewardDistributor.ts](deploy%2F0003_DevRewardDistributor.ts) (TODO: write more precisely)
- **FluenceToken** based on **ERC20VotesUpgradeable** (OpenZeppelin) for the DAO purposes.

## DAO Proposal Flow

TODO: add other options like: threshold not reached, etc.
```mermaid
sequenceDiagram
    actor user
    box Fluence Contracts
        participant Governor
        participant Executor as Executor (TimelockController)
    end
    participant FluenceMultisig
    
    user -->> Governor: propose (..., data, description)
    
    loop wait voting deplay
        Governor ->> Governor: wait for votingDelay()
    end
    
    user -->> Governor: castVote (proposalId, {Against, For, Abstain})
    
    Note over user,Governor: ...other votes...
    
    loop wait voting period
        Governor ->> Governor: wait for votingPeriod()
    end
    
    user -->>+ Governor: queue (..., data, description)
    Governor ->>- Executor: scheduleBatch(..., data, salt [based on description])
    
    opt veto
        FluenceMultisig -->> Executor: cancel (..., data, description)
    end
    
    loop wait minDelay
        Executor ->> Executor: wait for minDelay()
    end
    
    alt no veto
        user -->>+ Governor: execute(..., data, description)
        Governor ->>- Executor: check status
    end
    
    alt veto
        user -->>+ Governor: execute(..., data, description)
        Governor -x- Executor: check status: cancelled
    end
```

## Deploy & Role Delegation Flow
Deploy Flow according to [deploy scripts](deploy).

```mermaid
sequenceDiagram
    
    actor deployer
    box Fluence Contracts
        participant FluenceToken
        participant LPController
        participant Uniswap
        participant DevRewardDistributor
        participant FluenceVesting
        participant InvestorsVesting
        participant TeamVesting as Vesting with Voting
        participant Executor as Executor (TimelockController)
        participant Governor
    end
    participant  FluenceMultisig
    
    alt 0000_FluenceToken.ts
        deployer ->> FluenceToken: deploy (totalSupply)
        Note over FluenceToken: Owner: deployer
        FluenceToken -->> deployer: mint (totalSupply)
    end
    
    alt 0001_Executor.ts
        deployer ->> Executor: deploy (minDelay)
        Note over Executor: Admin Role: deployer, Executor Role: [0x0]
    end
        
    alt 0002_LPController.ts
        deployer ->>+ LPController: deploy (...Uniswap, balancer, Executor, FluenceToken, token, weights...)
        Note over LPController: Owner: deployer, Withdraw address: Executor
        LPController ->>- Uniswap: uniswapPositionManager.mint() 
        Note over Uniswap: Recipient: Executor
    end
    
    alt 0003_DevRewardDistributor.ts
        deployer ->> DevRewardDistributor: deploy (FluenceToken, Executor, merkle root, halvePeriod, initialReward, claimingPeriod)
        Note over DevRewardDistributor: unclaimed reward receiver: Executor
        deployer ->>+ FluenceToken: transfer (totalRewards) to DevRewardDistributor
        FluenceToken ->>- DevRewardDistributor: transfer (totalRewards)
    end
    
    alt Vesting
        alt 0004_FluenceVesting.ts
            deployer ->> FluenceVesting: deploy (FluenceToken, cliffDuration , vestingDuration , accounts , amounts)
            deployer ->>+ FluenceToken: transfer (totalAmounts) to FluenceVesting
            FluenceToken ->>- FluenceVesting: transfer (totalAmounts)
            Note over FluenceVesting: could transfer(0x00, amount) to release FluenceToken for accounts accordingly: accounts
        end
        
        alt 0005_InvestorsVesting.ts
            deployer ->> InvestorsVesting: deploy (FluenceToken, cliffDuration , vestingDuration , accounts , amounts)
            deployer ->>+ FluenceToken: transfer (totalAmounts) to FluenceVesting
            FluenceToken ->>- InvestorsVesting: transfer (totalAmounts)
            Note over InvestorsVesting: could transfer(0x00, amount) to release FluenceToken for accounts accordingly: accounts
        end
        
        alt 0006_TeamVesting.ts
            deployer ->> TeamVesting: deploy (FluenceToken, cliffDuration , vestingDuration , accounts , amounts)
            deployer ->>+ FluenceToken: transfer (totalAmounts) to FluenceVesting
            FluenceToken ->>- TeamVesting: transfer (totalAmounts)
            Note over TeamVesting: could transfer(0x00, amount) to release FluenceToken for accounts accordingly: accounts
        end
    end
    
    alt 0007_Governor.ts
        deployer ->> Governor: deploy (FluenceToken, TeamVesting, Executor, quorum, initialVotingDelay, initialVotingPeriod, initialProposalThreshold)
        
        deployer ->> Executor: grantRole(RPROPOSER_ROLE, Governor)
        deployer ->> Executor: grantRole(CANCELLER_ROLE, Governor)
        deployer ->> Executor: grantRole(CANCELLER_ROLE, FluenceMultisig)
        deployer ->> Executor: revokeRole(ADMIN_ROLE, deployer)
        deployer ->>+ FluenceToken: transfer (balance) to Governor
        FluenceToken ->>- Executor: transfer (balance)
        FluenceToken ->> Executor: transferOwnership(Executor)
        
        Note over Governor: Owner: Executor
        Note over FluenceToken: Owner: Executor
        Note over Executor: Admin Role: [0x0]
        Note over Executor: Proposer Role: [Governor]
        Note over Executor: Canceller Role: [Governor, FluenceMultisig]
    end
```

## Develop

### Install dep

> `npm install`

### Set config.yaml 
<details>
  <summary>Empty yaml example with description</summary>
    ```yaml
    networks:
      etherscanApiKey: {etherscan key}
      repotGas: true
      testnet:
        url:  {testnet eth node url}
        privateKey: {private key for testnet}
    
      mainnet:
        url:  {mainnet eth node url}
        privateKey: {private key for mainnet}
    
    deployment:
      contracts:
        usdToken: {usd token address}
        balancerLBPFactory: {balancer LBP factory address}
        uniswapFactory: {uniwap factory address}
        balancerVault: {balancer vault address}
    
      pool:
        lbpPoolDurationDays: {days duration of lbp}
        swapFeePercentage: {fee for lbp swap}
        flt:
          weight: {start weight}
          endWeight: {end weight}
          initialAmount: {initial amount}
        usd:
        weight: {start weight}
          endWeight: {end weight}
          initialAmount: {initial amount}
    
      token:
        totalSupply: {DAO total token supply}
    
      executor:
        delayDays: {delay from success proposal to execution}
    
      devRewardDistributor:
        merkleRoot: {reward from merkle reward tree}
        initialReward: {initial reward}
        totalRewards: {total reward of all users}
        halvePeriodMonths: {reward halve period}
        claimingPeriodMonths: {claim period in months}
    
      investorsVesting:
        delayDurationMonths: 1
        vestingDurationMonths: 1
        csvFile: {csv file with investors addresses and tokens}
    
      fluenceVesting:
        delayDurationMonths: 1
        vestingDurationMonths: 1
        account: {fluence account}
        amount: 10
    
      teamVesting:
        delayDurationMonths: 1
        vestingDurationMonths: 1
        csvFile: {csv file with team members addresses and tokens}
    
      governor:
        votingDelayDays: {delay from create voting to start voting}
        votingPeriodDays: {voting period for proposals}
        proposalThreshold: {min token for creating proposal}
    ```
</details>

on the other hand, the [config.example.yaml](config.example.yaml) represents file 
- to be copied as it is
- to be complete to run for **tests** after replacing "http://test.com" to the workable one for the Mainnet (we use fork, and for the tests as well).

TODO: why testnet

### Prepare Env

```bash
npm run compile
npm run typechain
```

## Start test

`npm test`

## Docs

[More info](https://github.com/fluencelabs/dao/contracts/DOC.md)
