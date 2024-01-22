//// week10.Staking.hs

use aiken/dict.{get}
use aiken/list.{reduce}
use aiken/transaction.{Publish, ScriptContext, WithdrawFrom}
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{lovelace_of}

/// Address which will always receive half
validator(addr: Address) {
  fn staking(_: Void, ctx: ScriptContext) {
    when ctx.purpose is {
      // allow arbitrary delegation and the registration
      Publish(_) -> True

      // rewarding credential
      WithdrawFrom(cred) -> {
        let info = ctx.transaction

        // get the total reward amount
        expect Some(amt) = info.withdrawals |> get(cred)

        // the total number of lovelace paid to the specified address
        let paid_to_address =
          info.outputs
            |> reduce(
                 0,
                 fn(sum, output) {
                   sum + if output.address == addr {
                     lovelace_of(output.value)
                   } else {
                     0
                   }
                 },
               )

        if 2 * paid_to_address >= amt {
          // address `addr` receives at least half of the rewards
          True
        } else {
          trace @"insufficient reward sharing"
          False
        }
      }

      // minting and spending it fails validation
      _ -> False
    }
  }
}
