import { BigInt } from "@graphprotocol/graph-ts"
import {
  DevRewardDistributor,
  Claimed,
  TransferUnclaimed
} from "../generated/DevRewardDistributor/DevRewardDistributor"
import {
  DevRewardDistributor as DevRewardDistributorEntity,
  Account
} from "../generated/schema"
import { distributorAddress, merkleRoot } from '../utils/helpers'


export function handleClaimed(event: Claimed): void {
  let distributor = DevRewardDistributorEntity.load(distributorAddress)

  if (distributor == null) {
    distributor = new DevRewardDistributorEntity(distributorAddress)
    distributor.merkleRoot = merkleRoot
    distributor.claimers = BigInt.fromI32(0)
  }

  distributor.claimers = distributor.claimers + BigInt.fromI32(1)
  distributor.save()

  let account = Account.load(event.transaction.from.toHex())
  if (account == null) {
    account = new Account(event.transaction.from.toHex())
    account.amount = BigInt.fromI32(0)
  }

  account.user_id = event.params.userId
  account.amount = event.params.amount
  account.save()
}

export function handleTransferUnclaimed(event: TransferUnclaimed): void { }
