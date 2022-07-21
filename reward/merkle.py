from web3 import Web3

def hash_nodes(nodes):
    newNodes = []
    for i in range(0, len(nodes), 2):
        if len(nodes) % 2 != 0 and i+1 >= len(nodes):
            newNodes.append(nodes[i])
            break
        
        if (int(nodes[i].hex(), 16) < int(nodes[i+1].hex(), 16)):
            newNodes.append(Web3.keccak(nodes[i] + nodes[i+1]))
        else:
            newNodes.append(Web3.keccak(nodes[i+1] + nodes[i]))

    return newNodes

def create_leafs(accounts):
    leafs = []
    for i, account in enumerate(accounts):
        leaf = Web3.solidityKeccak(
            ["uint256", "bytes32"],
            [
                i,
                "0x000000000000000000000000" + account.replace("0x", "")
            ]
        )
        leafs.append(leaf)

    return leafs

def gen_merkle_root(accounts):
    nodes = create_leafs(accounts)

    while (len(nodes) > 1):
        nodes = hash_nodes(nodes)
    return nodes[0].hex()

def gen_merkle_proof(accounts, index):
    nodes = create_leafs(accounts)
    leaf = nodes[index]
    proof = []
    while (len(nodes) > 1):
        if len(nodes) % 2 == 0 or index != len(nodes)-1:
            if (index % 2 == 0):
                proof.append(nodes[index+1])
            else:
                proof.append(nodes[index-1])
            
        nodes = hash_nodes(nodes)
        index = index // 2;

    return (leaf, proof)