# Quiet Ledger Compact contract

`quiet-ledger.compact` has public eligibility commitments, a public active window,
a public replay-prevention set, and a public aggregate signal counter. Its private
witnesses are a worker-held eligibility commitment and the worker-held nullifier
secret. The raw response and worker identity are not contract inputs.

`submitSignal` deliberately discloses only a window-scoped nullifier so the ledger
can reject a second signal. The value is a one-way, window-specific hash—not a
credential or identity. `rotateWindow` deliberately discloses the new public
period label. These are the only `disclose()` uses.

Compile with Compact toolchain 0.31.1 (language 0.23, the current public-network-compatible toolchain): `npm run contract:compile`.
This emits JavaScript typings/client code, ZKIR per exported circuit, and proving
keys to `contracts/managed/`. Treat those generated artifacts as deployment
artifacts and commit them only after compiling with the exact compiler release.
