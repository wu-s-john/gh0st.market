"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { jobRegistryAbi } from "@/generated";
import { JOB_REGISTRY_ADDRESS } from "@/lib/contracts";

// Params for creating a job spec (matches contract struct)
export interface CreateJobSpecParams {
  mainDomain: string;
  notarizeUrl: string;
  description: string;
  promptInstructions: string;
  outputSchema: string;
  inputSchema: string;
  validationRules: string;
}

// Params for creating a job
export interface CreateJobParams {
  specId: bigint;
  inputs: string;
  token: `0x${string}`; // address(0) for ETH
  bounty: bigint;
  requesterContact: string;
}

/**
 * Hook for creating a new job spec
 */
export function useCreateJobSpec() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createJobSpec = (params: CreateJobSpecParams) => {
    writeContract({
      address: JOB_REGISTRY_ADDRESS,
      abi: jobRegistryAbi,
      functionName: "createJobSpec",
      args: [
        {
          mainDomain: params.mainDomain,
          notarizeUrl: params.notarizeUrl,
          description: params.description,
          promptInstructions: params.promptInstructions,
          outputSchema: params.outputSchema,
          inputSchema: params.inputSchema,
          validationRules: params.validationRules,
        },
      ],
    });
  };

  return {
    createJobSpec,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for creating a new job with bounty
 */
export function useCreateJob() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createJob = (params: CreateJobParams) => {
    const isEthPayment = params.token === "0x0000000000000000000000000000000000000000";

    writeContract({
      address: JOB_REGISTRY_ADDRESS,
      abi: jobRegistryAbi,
      functionName: "createJob",
      args: [
        {
          specId: params.specId,
          inputs: params.inputs,
          token: params.token,
          bounty: params.bounty,
          requesterContact: params.requesterContact,
        },
      ],
      // Send ETH value if paying with native ETH
      value: isEthPayment ? params.bounty : BigInt(0),
    });
  };

  return {
    createJob,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for toggling job spec active status
 */
export function useSetJobSpecActive() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setJobSpecActive = (specId: bigint, active: boolean) => {
    writeContract({
      address: JOB_REGISTRY_ADDRESS,
      abi: jobRegistryAbi,
      functionName: "setJobSpecActive",
      args: [specId, active],
    });
  };

  return {
    setJobSpecActive,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for submitting work (worker flow)
 */
export function useSubmitWork() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitWork = (
    jobId: bigint,
    resultPayload: string,
    proof: `0x${string}`,
    paymentAddress: `0x${string}`
  ) => {
    writeContract({
      address: JOB_REGISTRY_ADDRESS,
      abi: jobRegistryAbi,
      functionName: "submitWork",
      args: [jobId, resultPayload, proof, paymentAddress],
    });
  };

  return {
    submitWork,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Helper to convert ETH string to wei
 */
export function ethToWei(eth: string): bigint {
  return parseEther(eth);
}
