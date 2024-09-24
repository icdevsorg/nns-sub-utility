## v0_2_0 - 2024-09-24 Code Fix

Fixes
- Updated to ICRC79.mo v0_2_2 - See change long at https://github.com/PanIndustrial-Org/icrc79.mo/blob/main/CHANGELOG.md
  - Fix in query processing to ensure deterministic ordering for pagination and look up with a fall back for deleted records.
  - Fixes for bugs caused by deduping transaction code that would error on retries of previously failed transactions(ie. subscribing with out an approval and then trying again after making an approval)
  - Updates - Adde some fields to the product object for convenience
- Rerun blockchain from genesis to fix misspelled item. Obviously not something we want to do regularly, but since we have less than 80 blocks, this is the time to do it.
- Add ICRC3_supported_block_types
