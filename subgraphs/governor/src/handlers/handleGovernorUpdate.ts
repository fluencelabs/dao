import {
	NewGovernanceAdmin,
	NewGovernancePendingAdmin,
	NewGovernanceImplementation,
	ProposalThresholdSet,
	VotingDelaySet,
	VotingPeriodSet,
} from '../../generated/schema'

import {
	NewAdmin             as NewAdminEvent,
	NewImplementation    as NewImplementationEvent,
	NewPendingAdmin      as NewPendingAdminEvent,
	ProposalThresholdSet as ProposalThresholdSetEvent,
	VotingDelaySet       as VotingDelaySetEvent,
	VotingPeriodSet      as VotingPeriodSetEvent,
} from '../../generated/Governor/IGovernor'

import {
	events,
	transactions,
} from '@amxx/graphprotocol-utils'

import {
	fetchAccount,
} from '../fetch/account'

import {
	fetchGovernor,
} from '../fetch/governor'

export function handleNewAdmin(event: NewAdminEvent): void {
	let governor               = fetchGovernor(event.address)
	if (governor == null) return
	governor.admin             = fetchAccount(event.params.newAdmin).id
	governor.save()

	let ev                     = new NewGovernanceAdmin(events.id(event))
	ev.transaction             = transactions.log(event).id
	ev.timestamp               = event.block.timestamp
	ev.governor                = governor.id
	ev.newAdmin                = fetchAccount(event.params.newAdmin).id
	ev.oldAdmin                = fetchAccount(event.params.oldAdmin).id
	ev.save()
}

export function handleNewPendingAdmin(event: NewPendingAdminEvent): void {
	let governor               = fetchGovernor(event.address)
	if (governor == null) return
	governor.pendingAdmin      = fetchAccount(event.params.newPendingAdmin).id
	governor.save()

	let ev                     = new NewGovernancePendingAdmin(events.id(event))
	ev.transaction             = transactions.log(event).id
	ev.timestamp               = event.block.timestamp
	ev.governor                = governor.id
	ev.newPendingAdmin         = fetchAccount(event.params.newPendingAdmin).id
	ev.oldPendingAdmin         = fetchAccount(event.params.oldPendingAdmin).id
	ev.save()
}

export function handleNewImplementation(event: NewImplementationEvent): void {
	let governor               = fetchGovernor(event.address)
	if (governor == null) return
	governor.implementation    = fetchAccount(event.params.newImplementation).id
	governor.save()

	let ev                     = new NewGovernanceImplementation(events.id(event))
	ev.transaction             = transactions.log(event).id
	ev.timestamp               = event.block.timestamp
	ev.governor                = governor.id
	ev.oldImplementation       = fetchAccount(event.params.oldImplementation).id
	ev.newImplementation       = fetchAccount(event.params.newImplementation).id
	ev.save()
}

export function handleProposalThresholdSet(event: ProposalThresholdSetEvent): void {
	let governor               = fetchGovernor(event.address)
	if (governor == null) return
	governor.proposalThreshold = event.params.newProposalThreshold
	governor.save()

	let ev                     = new ProposalThresholdSet(events.id(event))
	ev.transaction             = transactions.log(event).id
	ev.timestamp               = event.block.timestamp
	ev.governor                = governor.id
	ev.newProposalThreshold    = event.params.newProposalThreshold
	ev.oldProposalThreshold    = event.params.oldProposalThreshold
	ev.save()
}

export function handleVotingDelaySet(event: VotingDelaySetEvent): void {
	let governor               = fetchGovernor(event.address)
	if (governor == null) return
	governor.votingDelay       = event.params.newVotingDelay
	governor.save()

	let ev                     = new VotingDelaySet(events.id(event))
	ev.transaction             = transactions.log(event).id
	ev.timestamp               = event.block.timestamp
	ev.governor                = governor.id
	ev.newVotingDelay          = event.params.newVotingDelay
	ev.oldVotingDelay          = event.params.oldVotingDelay
	ev.save()
}

export function handleVotingPeriodSet(event: VotingPeriodSetEvent): void {
	let governor               = fetchGovernor(event.address)
	if (governor == null) return
	governor.votingPeriod      = event.params.newVotingPeriod
	governor.save()

	let ev                     = new VotingPeriodSet(events.id(event))
	ev.transaction             = transactions.log(event).id
	ev.timestamp               = event.block.timestamp
	ev.governor                = governor.id
	ev.newVotingPeriod         = event.params.newVotingPeriod
	ev.oldVotingPeriod         = event.params.oldVotingPeriod
	ev.save()
}
