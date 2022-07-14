export const accountsMapper = (acc => ({
    ...acc, 
    // offchain values?
    name: 'Account',
    url: 'https://icon-library.com/images/account-icon-png/account-icon-png-2.jpg',

    wallet: acc.id,
    votes: acc?.balances[0]?.voting?.value >= 0 ? acc.balances[0].voting.value : 0,
    delegators: acc?.balances[0]?.delegatorsCount >= 0 ? acc.balances[0].delegatorsCount : 0,
    rating: acc?.balances[0]?.value?.value >= 0 ? acc?.balances[0].value.value : 0,
}))