# Provenance

`WC3OrdersList.txt` is the game's table of order ids: one `<order string> = <id>,` line per order, the string-less ones under the names UjAPI gives them (`itemdrag00`, `cmdcancel`, ...). The `OrderId` test (`../../order-id.test.ts`) checks every member of `OrderId` against it (#322). It is test data only: the library never ships or imports it.

- **Source**: [UnryzeC/UjAPI](https://github.com/UnryzeC/UjAPI), `TypeData/WC3OrdersList.txt` at commit [`ba2bb61bf6561efc30d180d441508febd0738c34`](https://github.com/UnryzeC/UjAPI/blob/ba2bb61bf6561efc30d180d441508febd0738c34/TypeData/WC3OrdersList.txt), byte for byte.
- **sha256**: `9d91bdfe8dfc965b2e3bf591775cbea7c2f4d185cc7150c52bac61c24ef462d2`.
- **License**: MIT, Copyright (c) 2022 Sandro Takaishvili; the notice is in `LICENSE` next to it.
- **Copied on**: 2026-10-02.

#255 names two more sources, WarRaft/Order `data/orders.c` and WurstStdlib2 `Orders.wurst`. At the time of copying, the three agreed on every order string `OrderId` names. UjAPI is the one vendored because it alone also names the ids that have no order string. Refreshing the table means swapping this file and updating the commit and sha256 above. The test then reports every member the new table disagrees with.
