// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {JobRegistry} from "../src/JobRegistry.sol";
import {ProofVerifier} from "../src/ProofVerifier.sol";
import {IJobRegistry} from "../src/interfaces/IJobRegistry.sol";
import {CreateJobSpecParams, CreateJobParams, JobSpec, Job, JobStatus} from "../src/types/JobTypes.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract JobRegistryTest is Test {
    JobRegistry public registry;
    ProofVerifier public verifier;
    ERC20Mock public usdc;
    ERC20Mock public wbtc;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public worker = makeAddr("worker");

    uint256 constant ETH_BOUNTY = 0.1 ether;
    uint256 constant USDC_BOUNTY = 100e6; // 100 USDC (6 decimals)
    uint256 constant WBTC_BOUNTY = 0.001e8; // 0.001 WBTC (8 decimals)

    // Sample spec params
    CreateJobSpecParams sampleSpecParams;

    function setUp() public {
        // Deploy contracts
        verifier = new ProofVerifier();
        registry = new JobRegistry(address(verifier));

        // Deploy mock tokens
        usdc = new ERC20Mock("USD Coin", "USDC", 6);
        wbtc = new ERC20Mock("Wrapped BTC", "WBTC", 8);

        // Fund accounts
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        usdc.mint(alice, 10_000e6);
        usdc.mint(bob, 10_000e6);
        wbtc.mint(alice, 1e8);
        wbtc.mint(bob, 1e8);

        // Setup sample spec params
        sampleSpecParams = CreateJobSpecParams({
            mainDomain: "crunchbase.com",
            notarizeUrl: "https://crunchbase.com/organization/{{orgSlug}}",
            description: "Fetch Crunchbase organization funding data",
            promptInstructions: "Navigate to the organization page and extract funding total from the Financials section",
            outputSchema: '{"type":"object","properties":{"funding":"number"}}',
            inputSchema: '{"type":"object","properties":{"orgSlug":"string"}}',
            validationRules: "funding >= 0"
        });
    }

    // ============ Full Flow Tests ============

    /// @notice Test full flow with ETH payment
    function test_FullFlow_ETH() public {
        // 1. Alice creates spec
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        // 2. Bob creates job with ETH bounty
        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Anthropic"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: "bob@0zk.eth"
        });

        vm.prank(bob);
        uint256 jobId = registry.createJob{value: ETH_BOUNTY}(jobParams);

        // Verify job state
        Job memory job = registry.getJob(jobId);
        assertEq(job.status == JobStatus.Open, true);
        assertEq(job.bounty, ETH_BOUNTY);
        assertEq(address(registry).balance, ETH_BOUNTY);

        // 3. Worker submits work
        uint256 workerBalanceBefore = worker.balance;

        vm.prank(worker);
        registry.submitWork(
            jobId,
            '{"funding":1500000000}',
            abi.encode("mock_proof"),
            worker
        );

        // Verify completion
        job = registry.getJob(jobId);
        assertEq(job.status == JobStatus.Completed, true);
        assertEq(job.worker, worker);
        assertEq(worker.balance, workerBalanceBefore + ETH_BOUNTY);
        assertEq(address(registry).balance, 0);
    }

    /// @notice Test full flow with USDC payment
    function test_FullFlow_USDC() public {
        // 1. Alice creates spec
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        // 2. Bob creates job with USDC bounty
        vm.startPrank(bob);
        usdc.approve(address(registry), USDC_BOUNTY);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"OpenAI"}',
            token: address(usdc),
            bounty: USDC_BOUNTY,
            requesterContact: ""
        });

        uint256 jobId = registry.createJob(jobParams);
        vm.stopPrank();

        // Verify escrow
        assertEq(usdc.balanceOf(address(registry)), USDC_BOUNTY);

        // 3. Worker submits work
        uint256 workerBalanceBefore = usdc.balanceOf(worker);

        vm.prank(worker);
        registry.submitWork(
            jobId,
            '{"funding":10000000000}',
            abi.encode("mock_proof"),
            worker
        );

        // Verify payment
        assertEq(usdc.balanceOf(worker), workerBalanceBefore + USDC_BOUNTY);
        assertEq(usdc.balanceOf(address(registry)), 0);
    }

    /// @notice Test full flow with WBTC payment
    function test_FullFlow_WBTC() public {
        // 1. Alice creates spec
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        // 2. Bob creates job with WBTC bounty
        vm.startPrank(bob);
        wbtc.approve(address(registry), WBTC_BOUNTY);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Stripe"}',
            token: address(wbtc),
            bounty: WBTC_BOUNTY,
            requesterContact: ""
        });

        uint256 jobId = registry.createJob(jobParams);
        vm.stopPrank();

        // Verify escrow
        assertEq(wbtc.balanceOf(address(registry)), WBTC_BOUNTY);

        // 3. Worker submits work
        uint256 workerBalanceBefore = wbtc.balanceOf(worker);

        vm.prank(worker);
        registry.submitWork(
            jobId,
            '{"funding":95000000000}',
            abi.encode("mock_proof"),
            worker
        );

        // Verify payment
        assertEq(wbtc.balanceOf(worker), workerBalanceBefore + WBTC_BOUNTY);
        assertEq(wbtc.balanceOf(address(registry)), 0);
    }

    // ============ JobSpec Tests ============

    /// @notice Test creating a job spec
    function test_CreateJobSpec() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        JobSpec memory spec = registry.getJobSpec(specId);
        assertEq(spec.mainDomain, "crunchbase.com");
        assertEq(spec.creator, alice);
        assertEq(spec.active, true);
        assertEq(spec.createdAt, block.timestamp);
    }

    /// @notice Test multiple specs have sequential IDs
    function test_CreateJobSpec_SequentialIds() public {
        vm.startPrank(alice);
        uint256 spec1 = registry.createJobSpec(sampleSpecParams);
        uint256 spec2 = registry.createJobSpec(sampleSpecParams);
        uint256 spec3 = registry.createJobSpec(sampleSpecParams);
        vm.stopPrank();

        assertEq(spec1, 0);
        assertEq(spec2, 1);
        assertEq(spec3, 2);
        assertEq(registry.getJobSpecCount(), 3);
    }

    /// @notice Test deactivating a job spec
    function test_SetJobSpecActive_Deactivate() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        vm.prank(alice);
        registry.setJobSpecActive(specId, false);

        JobSpec memory spec = registry.getJobSpec(specId);
        assertEq(spec.active, false);
    }

    /// @notice Test reactivating a job spec
    function test_SetJobSpecActive_Reactivate() public {
        vm.startPrank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);
        registry.setJobSpecActive(specId, false);
        registry.setJobSpecActive(specId, true);
        vm.stopPrank();

        JobSpec memory spec = registry.getJobSpec(specId);
        assertEq(spec.active, true);
    }

    /// @notice Test only creator can change spec active status
    function test_SetJobSpecActive_RevertNotCreator() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        vm.prank(bob);
        vm.expectRevert(JobRegistry.NotSpecCreator.selector);
        registry.setJobSpecActive(specId, false);
    }

    /// @notice Test cannot change active status of invalid spec
    function test_SetJobSpecActive_RevertInvalidSpec() public {
        vm.prank(alice);
        vm.expectRevert(JobRegistry.InvalidSpec.selector);
        registry.setJobSpecActive(999, false);
    }

    // ============ Job Creation Tests ============

    /// @notice Test creating job with ETH
    function test_CreateJob_ETH() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: "alice@test.com"
        });

        vm.prank(bob);
        uint256 jobId = registry.createJob{value: ETH_BOUNTY}(jobParams);

        Job memory job = registry.getJob(jobId);
        assertEq(job.specId, specId);
        assertEq(job.requester, bob);
        assertEq(job.bounty, ETH_BOUNTY);
        assertEq(job.token, address(0));
        assertEq(job.status == JobStatus.Open, true);
    }

    /// @notice Test creating job with ERC-20
    function test_CreateJob_ERC20() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        vm.startPrank(bob);
        usdc.approve(address(registry), USDC_BOUNTY);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(usdc),
            bounty: USDC_BOUNTY,
            requesterContact: ""
        });

        uint256 jobId = registry.createJob(jobParams);
        vm.stopPrank();

        Job memory job = registry.getJob(jobId);
        assertEq(job.token, address(usdc));
        assertEq(job.bounty, USDC_BOUNTY);
    }

    /// @notice Test cannot create job with zero bounty
    function test_CreateJob_RevertZeroBounty() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: 0,
            requesterContact: ""
        });

        vm.prank(bob);
        vm.expectRevert(JobRegistry.InvalidBounty.selector);
        registry.createJob(jobParams);
    }

    /// @notice Test cannot create job with invalid spec
    function test_CreateJob_RevertInvalidSpec() public {
        CreateJobParams memory jobParams = CreateJobParams({
            specId: 999,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        vm.expectRevert(JobRegistry.InvalidSpec.selector);
        registry.createJob{value: ETH_BOUNTY}(jobParams);
    }

    /// @notice Test cannot create job on inactive spec
    function test_CreateJob_RevertInactiveSpec() public {
        vm.startPrank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);
        registry.setJobSpecActive(specId, false);
        vm.stopPrank();

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        vm.expectRevert(JobRegistry.SpecNotActive.selector);
        registry.createJob{value: ETH_BOUNTY}(jobParams);
    }

    /// @notice Test ETH bounty must match msg.value
    function test_CreateJob_RevertETHMismatch() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        vm.expectRevert(JobRegistry.InvalidBounty.selector);
        registry.createJob{value: ETH_BOUNTY / 2}(jobParams);
    }

    /// @notice Test cannot send ETH with ERC-20 job
    function test_CreateJob_RevertTokenMismatch() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        vm.startPrank(bob);
        usdc.approve(address(registry), USDC_BOUNTY);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(usdc),
            bounty: USDC_BOUNTY,
            requesterContact: ""
        });

        vm.expectRevert(JobRegistry.TokenMismatch.selector);
        registry.createJob{value: 1 wei}(jobParams);
        vm.stopPrank();
    }

    // ============ Work Submission Tests ============

    /// @notice Test submit work pays worker
    function test_SubmitWork_PaysWorker() public {
        // Setup
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        uint256 jobId = registry.createJob{value: ETH_BOUNTY}(jobParams);

        // Submit work
        uint256 balanceBefore = worker.balance;

        vm.prank(worker);
        registry.submitWork(jobId, '{"result":"data"}', "", worker);

        assertEq(worker.balance, balanceBefore + ETH_BOUNTY);
    }

    /// @notice Test cannot submit work with zero payment address
    function test_SubmitWork_RevertInvalidPaymentAddress() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        uint256 jobId = registry.createJob{value: ETH_BOUNTY}(jobParams);

        vm.prank(worker);
        vm.expectRevert(JobRegistry.InvalidPaymentAddress.selector);
        registry.submitWork(jobId, '{"result":"data"}', "", address(0));
    }

    /// @notice Test cannot submit work for completed job
    function test_SubmitWork_RevertJobNotOpen() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        uint256 jobId = registry.createJob{value: ETH_BOUNTY}(jobParams);

        // First submission succeeds
        vm.prank(worker);
        registry.submitWork(jobId, '{"result":"data"}', "", worker);

        // Second submission fails
        address worker2 = makeAddr("worker2");
        vm.prank(worker2);
        vm.expectRevert(JobRegistry.JobNotOpen.selector);
        registry.submitWork(jobId, '{"result":"data2"}', "", worker2);
    }

    /// @notice Test work can be submitted to different payment address
    function test_SubmitWork_DifferentPaymentAddress() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        uint256 jobId = registry.createJob{value: ETH_BOUNTY}(jobParams);

        // Worker submits but payment goes to different address
        address paymentRecipient = makeAddr("paymentRecipient");
        uint256 balanceBefore = paymentRecipient.balance;

        vm.prank(worker);
        registry.submitWork(jobId, '{"result":"data"}', "", paymentRecipient);

        assertEq(paymentRecipient.balance, balanceBefore + ETH_BOUNTY);

        // Verify job records worker as payment address, not msg.sender
        Job memory job = registry.getJob(jobId);
        assertEq(job.worker, paymentRecipient);
    }

    // ============ View Function Tests ============

    /// @notice Test getJobSpec returns correct data
    function test_GetJobSpec() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        JobSpec memory spec = registry.getJobSpec(specId);
        assertEq(spec.mainDomain, sampleSpecParams.mainDomain);
        assertEq(spec.notarizeUrl, sampleSpecParams.notarizeUrl);
        assertEq(spec.description, sampleSpecParams.description);
        assertEq(spec.promptInstructions, sampleSpecParams.promptInstructions);
        assertEq(spec.outputSchema, sampleSpecParams.outputSchema);
        assertEq(spec.inputSchema, sampleSpecParams.inputSchema);
        assertEq(spec.validationRules, sampleSpecParams.validationRules);
        assertEq(spec.creator, alice);
        assertEq(spec.active, true);
    }

    /// @notice Test getJobSpecCount
    function test_GetJobSpecCount() public {
        assertEq(registry.getJobSpecCount(), 0);

        vm.startPrank(alice);
        registry.createJobSpec(sampleSpecParams);
        assertEq(registry.getJobSpecCount(), 1);

        registry.createJobSpec(sampleSpecParams);
        assertEq(registry.getJobSpecCount(), 2);
        vm.stopPrank();
    }

    /// @notice Test getJob returns correct data
    function test_GetJob() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: "contact"
        });

        vm.prank(bob);
        uint256 jobId = registry.createJob{value: ETH_BOUNTY}(jobParams);

        Job memory job = registry.getJob(jobId);
        assertEq(job.specId, specId);
        assertEq(job.inputs, jobParams.inputs);
        assertEq(job.requesterContact, jobParams.requesterContact);
        assertEq(job.token, address(0));
        assertEq(job.bounty, ETH_BOUNTY);
        assertEq(job.requester, bob);
        assertEq(job.status == JobStatus.Open, true);
    }

    /// @notice Test getJobCount
    function test_GetJobCount() public {
        vm.prank(alice);
        uint256 specId = registry.createJobSpec(sampleSpecParams);

        assertEq(registry.getJobCount(), 0);

        CreateJobParams memory jobParams = CreateJobParams({
            specId: specId,
            inputs: '{"companyName":"Test"}',
            token: address(0),
            bounty: ETH_BOUNTY,
            requesterContact: ""
        });

        vm.prank(bob);
        registry.createJob{value: ETH_BOUNTY}(jobParams);
        assertEq(registry.getJobCount(), 1);

        vm.prank(bob);
        registry.createJob{value: ETH_BOUNTY}(jobParams);
        assertEq(registry.getJobCount(), 2);
    }

    /// @notice Test proofVerifier returns correct address
    function test_ProofVerifier() public view {
        assertEq(address(registry.proofVerifier()), address(verifier));
    }
}
