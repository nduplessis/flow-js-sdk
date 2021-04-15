import * as sdk from "@onflow/sdk"
import * as t from "@onflow/types"
import {config} from "@onflow/config"

const Deps = {
    FLOWSTAKINGCOLLECTION: "0xLOCKEDTOKENADDRESS",
}

const Env = {
    local: {
        [Deps.FLOWSTAKINGCOLLECTION]: "0x0",
    },
    testnet: {
        [Deps.FLOWSTAKINGCOLLECTION]: "0x0",
    },
    mainnet: {
        [Deps.FLOWSTAKINGCOLLECTION]: "0x0",
    }
}

export const TITLE = "Request Unstaking"
export const DESCRIPTION = "Requests unstaking for a stake held in a Staking Collection."
export const VERSION = "0.0.0"
export const HASH = "dcae4faa6d689873f7caf7c5efef669f9fe1d4113e58b474b7aec1e07113a7ff"
export const CODE = 
`import FlowStakingCollection from 0xSTAKINGCOLLECTIONADDRESS

/// Request to withdraw rewarded tokens for the specified node or delegator in the staking collection
/// The tokens are automatically deposited to the unlocked account vault first,
/// And then any locked tokens are deposited into the locked account vault

transaction(nodeID: String, delegatorID: UInt32?, amount: UFix64) {
    
    let stakingCollectionRef: &FlowStakingCollection.StakingCollection

    prepare(account: AuthAccount) {
        self.stakingCollectionRef = account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
            ?? panic("Could not borrow ref to StakingCollection")
    }

    execute {
        self.stakingCollectionRef.withdrawRewardedTokens(nodeID: nodeID, delegatorID: delegatorID, amount: amount)
    }
}
`

export const template = async ({ proposer, authorization, payer, nodeId = "", delegatorId = null, amount = ""}) => {
    const env = await config().get("env", "mainnet")
    let code = CODE.replace(Deps.FLOWSTAKINGCOLLECTION, Env[env][Deps.FLOWSTAKINGCOLLECTION])

    return sdk.pipe([
        sdk.transaction(code),
        sdk.args([sdk.arg(nodeId, t.String), sdk.arg(delegatorId, t.Optional(t.UInt32), sdk.arg(amount, t.UFix64))]),
        sdk.proposer(proposer),
        sdk.authorizations([authorization]),
        sdk.payer(payer),
        sdk.validator((ix, {Ok, Bad}) => {
            if (ix.authorizations.length > 1) return Bad(ix, "template only requires one authorization.")
            return Ok(ix)
        })
    ])
}