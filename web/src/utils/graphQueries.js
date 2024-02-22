import { gql } from '@apollo/client'

export const findAccountQueryFactory = address => gql`
{
    account(id:"${address.toLowerCase()}") {
        id
    }
}
`

export const proposalsAccountsQuery = gql`
{
    proposals(
    first: 5,
    orderBy: id,
    orderDirection: desc
    ) {
        id,
        title,
        proposalCreated {
            timestamp
        },
        canceled,
        executed,
        forVotes {
            value
        },
        againstVotes {
            value
        },
        abstainVotes {
            value
        },
        eta
    } 
    accounts(
        first:6,
    ) {
        id,
        balances {
        delegatorsCount,
        value {
            value
        },
        voting {
            value
        }
        }
    }
}    
`

export const proposalsQuery = gql`
{
    proposals(
    first: 5,
    orderBy: id,
    orderDirection: desc
    ) {
        id,
        title,
        proposalCreated {
            timestamp
        },
        canceled,
        executed,
        forVotes {
            value
        },
        againstVotes {
            value
        },
        abstainVotes {
            value
        },
        eta
    } 
}
`

export const testAccsQuery = gql`
{
  accounts(first: 5) {
    id
    asGovernor {
      id
    }
    asToken {
      id
    }
    asTimelock {
      id
    }
  }
}
`

export const accountsQueryFactory = (amount) => (
    gql`
    {
        accounts(
            first:${amount},
        ) {
            id,
            balances {
            delegatorsCount,
            value {
                value
            },
            voting {
                value
            }
            }
        }
    }
    `
)