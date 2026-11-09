# Webhook token check

The service checks that a remote webhook accepts its token.
An operator runs the check from a command, before a release.
The check reads one configuration file and prints one verdict.

## Configuration

The configuration file holds one line: the endpoint template.
The template can hold references to environment variables.
These forms are valid:

- `$NAME` and `${NAME}` insert the value of the variable.
- `${NAME:-fallback}` inserts the fallback when the variable is unset or empty.
- `${NAME-fallback}` inserts the fallback only when the variable is unset.
- `$$` inserts one dollar sign.

A reference to an unset variable without a fallback expands to the empty string.
A trailing slash on the expanded endpoint is removed.
The caller can give its own lookup function for variables. The default reads the process environment.

## The request

The check sends one POST request to the endpoint.
The request carries the token in a header.
The request uses HTTPS. The caller can give an extra certificate authority for the TLS check.
The request has a timeout of 5 seconds.
A network error or a TLS error stops the check with an error. It is not a verdict.

## The verdict

The check reads the status code and the JSON body of the reply.
The body can hold a field `code`.
The verdict has three values:

- accepted: the status is 2xx and the code is `ok`.
- rejected: the status is 401 or 403, or the code is `token_invalid` or `token_expired`.
- unknown: every other case. This includes a body that is not valid JSON and a code the check does not know.

A rejected verdict wins over an accepted one when both signals are present.
Each verdict carries a short reason for the operator.

## Packaging

The feature has one public entry: a function that takes the configuration path and the variable lookup, and returns the verdict.
The feature goes in a new package (a folder) below the transport package of the service.
No product names appear in code or messages.
