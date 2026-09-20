/**
 * GhostImprint Stylometry Lexicon Bundle v1
 * Condition -> semantically equivalent phrasing variants. The author seed
 * (or agent) selects one variant per site; the choice is logged in the
 * application receipt and the auditor matches recorded variants only.
 * Population rarity tiers are assigned by judgment in v5 and are NOT
 * statistical claims. See the roadmap for corpus baselining.
 */
module.exports = [
  { id: 'conn-refused', condition: 'upstream connection refused', variants: ['Connection refused by upstream host', 'Upstream host declined connection', 'Upstream endpoint rejected the connection'] },
  { id: 'timeout', condition: 'operation timed out', variants: ['Operation timed out after the allotted window', 'Deadline exceeded before completion', 'The allotted time elapsed without a result'] },
  { id: 'not-found', condition: 'resource not found', variants: ['Requested resource could not be located', 'No matching resource exists', 'Lookup found no such resource'] },
  { id: 'auth-failed', condition: 'authentication failed', variants: ['Authentication failed for the supplied credentials', 'Credentials were rejected during authentication', 'Unable to authenticate with the provided credentials'] },
  { id: 'rate-limit', condition: 'rate limit exceeded', variants: ['Rate limit exceeded, backing off', 'Request quota exhausted for this window', 'Too many requests in the current window'] },
  { id: 'invalid-input', condition: 'invalid input supplied', variants: ['Supplied input failed validation', 'Input did not satisfy the expected shape', 'Validation rejected the provided input'] },
  { id: 'disk-full', condition: 'disk full while writing', variants: ['Write failed: storage volume is full', 'Insufficient disk space to complete the write', 'No space left on the target volume'] },
  { id: 'parse-error', condition: 'parse failure', variants: ['Failed to parse the response payload', 'Payload could not be parsed as expected', 'Parsing the response produced an error'] },
  { id: 'network-down', condition: 'network unreachable', variants: ['Network is unreachable from this host', 'No route to the remote host', 'The remote host cannot be reached'] },
  { id: 'conflict', condition: 'version conflict on write', variants: ['Write conflict: version mismatch detected', 'Conflicting version, write was rejected', 'Version conflict aborted the write'] },
  { id: 'unauthorized', condition: 'missing permission', variants: ['Missing permission for this operation', 'Operation requires a permission that was not granted', 'Not authorized to perform this operation'] },
  { id: 'service-busy', condition: 'dependency overloaded', variants: ['Dependency is overloaded, retrying', 'Upstream service reported excessive load', 'The backing service is too busy to respond'] },
  { id: 'checksum', condition: 'checksum mismatch', variants: ['Checksum mismatch on received bytes', 'Integrity check failed for the payload', 'Payload hash does not match the manifest'] },
  { id: 'empty-result', condition: 'query returned nothing', variants: ['Query completed with zero results', 'No rows matched the query', 'The query returned an empty set'] },
  { id: 'locked', condition: 'resource locked', variants: ['Resource is locked by another holder', 'Lock contention prevented access', 'Another process holds the resource lock'] },
  { id: 'expired', condition: 'token or session expired', variants: ['Session has expired, re-authentication required', 'Token lifetime elapsed', 'Credentials expired during the session'] },
  { id: 'unsupported', condition: 'unsupported operation', variants: ['Operation is not supported on this target', 'Unsupported operation for the current configuration', 'This target does not implement the operation'] },
  { id: 'overflow', condition: 'buffer or queue overflow', variants: ['Buffer overflow: oldest entries were dropped', 'Queue capacity exceeded, shedding load', 'Internal buffer ran out of capacity'] },
  { id: 'canceled', condition: 'operation canceled', variants: ['Operation was canceled before completion', 'Cancellation requested, aborting cleanly', 'The running task was canceled'] },
  { id: 'dep-missing', condition: 'dependency unavailable', variants: ['Required dependency is unavailable', 'Missing dependency for this code path', 'Dependency could not be resolved'] },
  { id: 'config-bad', condition: 'invalid configuration', variants: ['Configuration failed validation checks', 'Invalid configuration value detected', 'Config file contains an unsupported value'] },
  { id: 'io-error', condition: 'generic IO failure', variants: ['Underlying IO operation failed', 'Storage layer reported an error', 'Read/write against storage failed'] },
  { id: 'retry-out', condition: 'retries exhausted', variants: ['Retry budget exhausted, giving up', 'All retry attempts failed', 'No retries remain for this operation'] },
  { id: 'stale-cache', condition: 'stale cached data', variants: ['Cached entry is stale, refreshing', 'Stale cache detected, revalidating', 'Cache entry exceeded its freshness window'] }
];
