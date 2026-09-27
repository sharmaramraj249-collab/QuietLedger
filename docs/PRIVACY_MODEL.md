# Privacy model

## Boundary

The private witness consists of an eligible-credential commitment and a worker-held nullifier secret. The browser supplies these to the proving flow; no FastAPI route or Gemini call accepts them. A raw workplace note is deliberately outside the contract and browser proof input.

| An observer can learn | An observer cannot learn |
| --- | --- |
| A valid signal increment occurred | The worker’s identity or wallet address |
| The public listening window | Credential contents, tenure, age or department |
| A one-way, window-scoped nullifier | Whether two different-window nullifiers belong to one person |
| Aggregate signal count | A raw note, response, category or private witness |
| Explicit public disclosure scope | Seed phrases, document content and local secret |

## `disclose()` justification

`usedNullifiers.insert(disclose(nullifier))` permits only a deterministic, window-specific hash to become public so a second signal is rejected. `activeWindow = disclose(...)` makes the listening period public. Neither call releases a private credential or raw worker response.

## Gemini boundary

Gemini receives only a public policy sentence after sensitive-pattern redaction. It returns a Pydantic-validated explanation. It never receives a witness, credential, identity document, seed phrase, wallet address, raw response or exact confidential attribute. The backend stores a SHA-256 hash of the public policy, not the policy text.

