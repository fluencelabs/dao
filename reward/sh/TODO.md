## Web site
- [x] Change logic to accept data as proof.sh returns it
- [x] Specifically, copy ASN1Parse logic from "deployAward.js" to parse OpenSSL's signature
- [x] Redeploy smart contract to Kovan and point subgraph to the new contract
- [ ] Add a way to update list of rewarded usernames
- [ ] ??? Move list of merkle proofs / merkle tree to the website to make copy-pasted text smaller?

## Smart contract
- [x] In smart contract, check that Sender address was signed by Temporary Address
    - [x] temporary address is the one encrypted in keys.bin. It's also the one stored in Merkle Tree.

- [x] On contract deployment, save private keys to accounts.json so it is possible to use them for proof.sh

- [x] Prepare test data (usernames, keys) and redeploy DevRewardDistributor with that data
    - [x] generate merkle proofs for that data, so it's possible to test even before MerkleProof is generated in bash scripts

## Scripts
- [x] Print userId and MerkleProof in proof.sh (right now only signature is printed)
- [x] Write a JS script for MerkleProof & MerkleTree computation
- [x] Compute MerkleProof & MerkleTree in generate_poc.sh / generate.sh
- [x] Actually implement the whole generate.sh script. 
    - It should 
        1. take a list of (GH-name, SSH key), 
        2. group it by username, 
        3. generate a single Temporary Address per GH username
        4. encrypt that Temporary Address for each SSH key that user has
    - This way, each user will have a single reward, but could use _any_ of the GH SSH keys to claim it

- [x] !!! DO NOT STORE keys_file ON FILESYSTEM. Instead, keep unencrypted eth private keys ONLY IN MEMORY. !!!

## Docker container
- [x] Package everything as a Docker container
    - `docker run --rm -it --network none -v ~/.ssh:/root/.ssh:ro fluencelabs/proof`
- [ ] Write a script that will download & run docker container (WITHOUT NETWORK ACCESS) to compute the Proof
- [ ] Document how to build that Docker container manually
- [ ] ??? Document how to do same thing without a docker container

## Other
- [ ] Write an instruction for "If you are an advanced Ethereum user, you can claim directly from the smart contract. Learn how to do it"

## Thoughts
- [ ] Move MerkleProof generation to website? It will make copy-pasted proof a lot smaller.
    - [ ] But it will make it harder to claim without website
