# Quiet Ledger Compact contract

`quiet-ledger.compact` is deployed once per worker and listening window through
their connected wallet. It has a public credential commitment, a public active
window, a public replay-prevention set, and a public signal counter. Its private
witnesses are the worker-held credential commitment and nullifier secret. The raw
response and worker identity are not contract inputs.

The constructor deliberately discloses a one-way credential commitment into the
worker's personal instance. `submitSignal` discloses only a window-scoped nullifier
so that instance can reject a second signal. Neither value is a credential secret
or identity.

Compile with Compact toolchain 0.31.1 (language 0.23, the current public-network-compatible toolchain): `npm run contract:compile`.
This emits JavaScript typings/client code, ZKIR per exported circuit, and proving
keys to `contracts/managed/`. Netlify compiles these artifacts during its Linux
build because the Compact compiler is not available natively on Windows.
