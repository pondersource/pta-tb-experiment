export function createTransferErrorToString(code) {
  const meanings = [
    "ok",
    "linked_event_failed",
    "linked_event_chain_open",

    "reserved_flag",
    "reserved_field",

    "id_must_not_be_zero",
    "id_must_not_be_int_max",
    "debit_account_id_must_not_be_zero",
    "debit_account_id_must_not_be_int_max",
    "'credit_account_id_must_not_be_zero'",
    "credit_account_id_must_not_be_int_max",
    "accounts_must_be_different",

    "pending_id_must_be_zero",
    "pending_transfer_must_timeout",

    "ledger_must_not_be_zero",
    "code_must_not_be_zero",
    "amount_must_not_be_zero",

    "debit_account_not_found",
    "credit_account_not_found",

    "accounts_must_have_the_same_ledger",
    "transfer_must_have_the_same_ledger_as_accounts",

    "exists_with_different_flags",
    "exists_with_different_debit_account_id",
    "exists_with_different_credit_account_id",
    "exists_with_different_user_data",
    "exists_with_different_pending_id",
    "exists_with_different_timeout",
    "exists_with_different_code",
    "exists_with_different_amount",
    "exists",

    "overflows_debits_pending",
    "overflows_credits_pending",
    "overflows_debits_posted",
    "overflows_credits_posted",
    "overflows_debits",
    "overflows_credits",

    "exceeds_credits",
    "exceeds_debits",

    "cannot_post_and_void_pending_transfer",
    "pending_transfer_cannot_post_or_void_another",
    "timeout_reserved_for_pending_transfer",

    "pending_id_must_not_be_zero",
    "pending_id_must_not_be_int_max",
    "pending_id_must_be_different",

    "pending_transfer_not_found",
    "pending_transfer_not_pending",

    "pending_transfer_has_different_debit_account_id",
    "pending_transfer_has_different_credit_account_id",
    "pending_transfer_has_different_ledger",
    "pending_transfer_has_different_code",

    "exceeds_pending_transfer_amount",
    "pending_transfer_has_different_amount",

    "pending_transfer_already_posted",
    "pending_transfer_already_voided",

    "pending_transfer_expired"
  ];
  return meanings[code];
}

export function createAccountErrorToString(code) {
  const meanings = [
    "ok",
    "linked_event_failed = 1",
    "linked_event_chain_open",

    "reserved_flag",
    "reserved_field",

    "id_must_not_be_zero",
    "id_must_not_be_int_max",
    "ledger_must_not_be_zero",
    "code_must_not_be_zero",
    "debits_pending_must_be_zero",
    "debits_posted_must_be_zero",
    "credits_pending_must_be_zero",
    "credits_posted_must_be_zero",

    "mutually_exclusive_flags",

    "exists_with_different_flags",
    "exists_with_different_user_data",
    "exists_with_different_ledger",
    "exists_with_different_code",
    "exists"
  ];
  return meanings[code];
}