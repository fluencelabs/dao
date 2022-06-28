# Reward Claim Documentation


## Claim Proof Docker Requirements

### Goal 

Allow eligible Github contributors to safely create a claim proof for submission to the reward web site with network-isolated, i.e., `--network none`, docker container.

### Proof Script

The proof is created by running [`proof.sh`](https://github.com/fluencelabs/token-wip/blob/main/reward/proof.sh).

### OS Image

Linux-based docker image with the following dependencies: 

#### openssl 1.1.1

```
install openssl 1.1.1
RUN apt install -y build-essential cmake zlib1g-dev libcppunit-dev git subversion wget && rm -rf /var/lib/apt/lists/*
RUN wget https://www.openssl.org/source/openssl-1.1.1m.tar.gz -O - | tar -xz
WORKDIR /openssl-1.1.1m
RUN ./config --prefix=/usr/local/openssl --openssldir=/usr/local/openssl && make && make install
WORKDIR /
```

#### sha3sum

*sha3sum* provides cross-platform sha3 capabilities including *keccak256*. Unfortunately, there are two utilities by the same name and we want the [Rust version](https://crates.io/crates/sha3sum) which is not widely available through package managers. The easiest way to get sha3sum installed is via the [available binaries](https://gitlab.com/kurdy/sha3sum/-/wikis/home).

#### Age cryptography

[Age](https://github.com/FiloSottile/age) is a file encryption tool that allows a wide range of key formats, including *ssh ed25519* and *ssh rsa*, allowing us to provide the necessary file encryption with the selected reward recipients' ssh keys 

### Distribution

Users are able to clone the [repo](https://github.com/fluencelabs/token-wip) and build from the [Dockerfile](https://github.com/fluencelabs/token-wip/blob/main/reward/docker/Dockerfile) or pull from Fluence's [docker hub](TBD).

---

## Instructions

### Check Your Reward Eligibility

In order to be able to check your eligibility, you need a browser and the public key of your Github account. You can find your github public ssh key in multiple ways including:

1. In your github account, click on your profile icon in the upper right corner, click on `Settings` in the drop-down menu and then click on `SSH and GPG keys`to get to your key(s)
2. Use `https://github.com/<your account name >.keys` in your browser or use he url with curl or similar in your terminal, .e.g., `curl https://github.com/boneyard93501.keys`.

Note that the string(s) displayed in the key section is the hashed value of your private key. You need to retrieve the actual **public** key from your system. If you don't remember which key files you used, you can check with[key you used](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/checking-for-existing-ssh-keys) for your Github account to try and find the filename of the key(s).

In most linux-based systems, including OSX, ssh keys are in the`.ssh` directory and on Windows systems in the `%HOMEDRIVE%%HOMEPATH%\\.ssh\\` directory. You should have two files corresponding to you key: a file with the public key usually ending with `.pub` and another one with the private key usually not have a file extension.  To check your eligibility yo only need the **public** key.
 
Now that you have the public key(s), go to the [Reward site](TBD) and follow the instructions to determine your eligibility. If you are eligible, you need to create and submit a claim proof discussed below.

### Setting Up

#### Key Management

Once you determined you are eligible for a reward, it is time to claim your reward. Alas, it's not quite as simple as clicking a "claim" button. Instead, we need to prepare a signed message in order to claim the reward from the [smart contract](TBD) managing the FLT token allocation. Once yo create that signed message, you can copy and paste it onto the webs site and then click the desired "claim button".

But in order to create and sign the claim message we need some cryptographic tools. The easiest way to proceed is with a Docker container we prepared that contains all the tools and execution script to quickly get you through the process. Since your reward allocation is based on your Github contribution, it seems a safe bet to assume that you have git installed. If not, install git following these [instructions](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git). Unless you want to run the scripts manually, you should have [Docker](https://docs.docker.com/get-docker/) installed on your system. Finally, you should have an Ethereum compatible wallet installed on your system unless you  want to use lower level tools. For the purpose of this tutorial, we will use MetaMask which can be installed as a [browser extension](https://metamask.io/download/).

#### Ethereum Wallet

If you don't have a Ethereum wallet, you need to get one.

In order to claim your reward, you need to have an Ethereum Wallet compatible with [WalletConnect](https://walletconnect.com/registry?type=wallet), such as [MetaMask](https://metamask.io/) and [Ledger](https://www.ledger.com/ledger-live). Follow the instructions provided by your chosen wallet provider.

### Claiming Up With Docker

**Before you run the docker container or the scripts directly, let's discuss security. In order to be able to create the signed message necessary for the smart contract to release the reward, the private key associated with the public key needs to be used. To eliminate the leakage of this key, we urge you the docker container with the [`--network none`](https://docs.docker.com/network/none/)flag, which makes sure that there is no network connection that can be used to leak secret materials. Moreover, once you finished downloading the docker image, you may also turn off your wifi or unplug your network connection. Once the signed message has been created, you can delete the docker container with `docker rm <container id>` and the image with `docker rmi <image id>` and go back online to finalize your claim.**


**Note that in addition to security, we have taken significant steps toward guarding your privacy. Specifically, the claim process does NOT establish a link between your Github persona and your Ethereum account affording you the highest level of pseudo-anonymity available to Ethereum account holders. More on that below.**

First, clone the Fluence [??? repo](???) repo to a destination of our choice and change into that directory. Before you proceed, feel free to inspect the content of each of the files. Please note that the corresponding smart contracts are available for inspection and download from [??? repo](???).

Once you are satisfied build the container with  the following command:

`docker build -t reward-image -f docker/Dockerfile .`

which creates a new docker image named `reward-image`. Use `docker images` to check for the existence of that image.

You now can proceed to start the reward-image container:
`docker run --rm -it --network none  -v ~/.ssh:/root/.ssh reward-image  /bin/bash`

As discussed above, your private key is needed to sign the message allowing you to make your claim. In order to access the signing key, we are mounting your `.ssh` directory to the docker container. Windows users please replace `~/.ssh` with our actual ssh directory, e.g., `%HOMEDRIVE%%HOMEPATH%\\.ssh\\`.

Please note that the `--network none` flag runs a container [without network](https://docs.docker.com/network/none/) access. That is, your private ssh key will not be leaked over he network. Since this is a critical security feature, let's make sure the container truly has no network connection by following these [instructions](https://docs.docker.com/network/none/) step 2 and 3.

### Creating Your Claim Proof

TODO: Finalize description how to run it


### Claiming Your Reward

TODO: Need website url
cut and past from: https://www.notion.so/fluencenetwork/Reward-Readme-Kovan-f2b39f89531b4575af67a9826094dcb0

### Summary

If you are eligible for a reward, you should have successfully create and submitted your proof and have ??? FLT in your account.











