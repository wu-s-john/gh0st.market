//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// JobRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const jobRegistryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_proofVerifier', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct CreateJobParams',
        type: 'tuple',
        components: [
          { name: 'specId', internalType: 'uint256', type: 'uint256' },
          { name: 'inputs', internalType: 'string', type: 'string' },
          { name: 'token', internalType: 'address', type: 'address' },
          { name: 'bounty', internalType: 'uint256', type: 'uint256' },
          { name: 'requesterContact', internalType: 'string', type: 'string' },
        ],
      },
    ],
    name: 'createJob',
    outputs: [{ name: 'jobId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct CreateJobSpecParams',
        type: 'tuple',
        components: [
          { name: 'targetDomain', internalType: 'string', type: 'string' },
          { name: 'instructions', internalType: 'string', type: 'string' },
          { name: 'outputSchema', internalType: 'string', type: 'string' },
          { name: 'inputSchema', internalType: 'string', type: 'string' },
          { name: 'validationRules', internalType: 'string', type: 'string' },
        ],
      },
    ],
    name: 'createJobSpec',
    outputs: [{ name: 'specId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'jobId', internalType: 'uint256', type: 'uint256' }],
    name: 'getJob',
    outputs: [
      {
        name: '',
        internalType: 'struct Job',
        type: 'tuple',
        components: [
          { name: 'specId', internalType: 'uint256', type: 'uint256' },
          { name: 'inputs', internalType: 'string', type: 'string' },
          { name: 'requesterContact', internalType: 'string', type: 'string' },
          { name: 'token', internalType: 'address', type: 'address' },
          { name: 'bounty', internalType: 'uint256', type: 'uint256' },
          { name: 'requester', internalType: 'address', type: 'address' },
          { name: 'status', internalType: 'enum JobStatus', type: 'uint8' },
          { name: 'createdAt', internalType: 'uint64', type: 'uint64' },
          { name: 'completedAt', internalType: 'uint64', type: 'uint64' },
          { name: 'resultPayload', internalType: 'string', type: 'string' },
          { name: 'worker', internalType: 'address', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getJobCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'specId', internalType: 'uint256', type: 'uint256' }],
    name: 'getJobSpec',
    outputs: [
      {
        name: '',
        internalType: 'struct JobSpec',
        type: 'tuple',
        components: [
          { name: 'targetDomain', internalType: 'string', type: 'string' },
          { name: 'instructions', internalType: 'string', type: 'string' },
          { name: 'outputSchema', internalType: 'string', type: 'string' },
          { name: 'inputSchema', internalType: 'string', type: 'string' },
          { name: 'validationRules', internalType: 'string', type: 'string' },
          { name: 'creator', internalType: 'address', type: 'address' },
          { name: 'createdAt', internalType: 'uint64', type: 'uint64' },
          { name: 'active', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getJobSpecCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proofVerifier',
    outputs: [
      { name: '', internalType: 'contract IProofVerifier', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'specId', internalType: 'uint256', type: 'uint256' },
      { name: 'active', internalType: 'bool', type: 'bool' },
    ],
    name: 'setJobSpecActive',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'jobId', internalType: 'uint256', type: 'uint256' },
      { name: 'resultPayload', internalType: 'string', type: 'string' },
      { name: 'proof', internalType: 'bytes', type: 'bytes' },
      { name: 'paymentAddress', internalType: 'address', type: 'address' },
    ],
    name: 'submitWork',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'jobId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'specId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'bounty',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'JobCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'specId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'active', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'JobSpecActiveChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'specId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'targetDomain',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'JobSpecCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'jobId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'resultPayload',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'bountyPaid',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkSubmitted',
  },
  { type: 'error', inputs: [], name: 'InvalidBounty' },
  { type: 'error', inputs: [], name: 'InvalidPaymentAddress' },
  { type: 'error', inputs: [], name: 'InvalidProof' },
  { type: 'error', inputs: [], name: 'InvalidSpec' },
  { type: 'error', inputs: [], name: 'JobNotOpen' },
  { type: 'error', inputs: [], name: 'NotSpecCreator' },
  { type: 'error', inputs: [], name: 'PaymentFailed' },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  { type: 'error', inputs: [], name: 'SpecNotActive' },
  { type: 'error', inputs: [], name: 'TokenMismatch' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ProofVerifier
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const proofVerifierAbi = [
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'bytes', type: 'bytes' },
      { name: '', internalType: 'string', type: 'string' },
    ],
    name: 'verifyProof',
    outputs: [{ name: 'valid', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
] as const
