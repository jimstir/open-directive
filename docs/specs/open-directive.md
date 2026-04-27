---
title: OPEN-DIRECTIVE
name: Open Directive
status: draft
category: Best Current Practice
contributors: Jimmy <@jimstir>

---

## Abstract

This document describes the different components of the Open Directive system.
The system allows an operator to launch their own decentralized auditing service on-chain.

## Motivation

Web3 applications are facing the growing problem of safety for their services.
Applications with resources conduct smart contract security audits before launching the service,
but these applications are still open to exploits.

The Open Directive system is a decentralized reporting system
The Open Directive brings security directly to the user of the application.
The user shouldn't have to believe some service that the proper security audits have been conducted.
Instead, the user could verify for themselves, even non-technical users.
Security analyst reports are submitted on a blockchain to help with transparency.
Validators are users, white hat security researchers,
who help improve these reports by submitting improvement reports.
If a validator believes that the analyst agent submitted an analysis that is incorrect, missing information, or needs any other improvements,
they can submit their improvement on-chain.
A tokenized reserve, [ERC7425](https://eips.ethereum.org/EIPS/eip-7425),
is used to help facilitate the relationship between validators and the analyst agent.
As new security incidents occur every season, this relationship between automated reporting and
human validator reporting can improve how users protect themselves within the growing web3 landscape.

### Terminology

- `owner`: The defined address on the tokenized reserve.
- operator: The owner of the agent resources being offered to the service.
- validator: A white hat security researcher submitting security reports.
- verifier: Any participant wanting to help expose a malicious operator.
- `directiveToken`: The token assigned to the ERC7425 reserve.

## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in
[RFC 2119](http://tools.ietf.org/html/rfc2119).

The system uses an LLM, a large language model, for reasoning to generate analysis reports.
This reporting SHOULD be generated with inputs from a set of tools and
other external factors related to the use case.
The operator MUST share the status of their LLM at the time of request.
Analysis reports MAY not be completely accurate,
so users in the system should be aware that each report may need improvements.
Also, an operator MAY keep the details of each tool being used private,
as the system MAY not verify each tool use.
This means even if the operator shares some details,
the operator is free to make changes to the tool at any time in the agent's lifecycle,
without sharing any updates to the system.

In the system, users are able to request analysis reports from agents they do not operate,
while trusting the results are genuine.
A user SHOULD have an open subscription before sending a report request or
to have access to current reports in the system.
This MUST be enforced by the operator and
is RECOMMENDED to support the system's incentive mechanism.
If not enforced, the system could be affected by spam reports,
a lack of incentives to improve reports, and
a lack of demand for new reports.*
It is RECOMMENDED for operators and validators to encrypt reports before submission.
Submission details are discussed further in the [tokenized reserve](#tokenized-reserve) section.

### Subscription

All subscription fees SHOULD be collected by the subscription smart contract.
The monthly price MUST be declared on-chain by the operator.
The operator MAY update this at any time.
At the time of subscription,
the user MAY pay any amount at the on-chain registered price.
The `directiveToken` is the RECOMMENDED default token for subscription fees.
Collected fees are owned by the subscription contract.

To withdraw funds, the operator MUST execute the transfer of all tokens owned by the contract.
For all withdrawals, 50% of the tokens owned by the subscription token MUST be transferred to the owner.
The other 50% MUST be transferred to the tokenized reserve contract. More details are discussed in the  
[tokenized reserve](#tokenized-reserve).

The fees collected are equally distributed between the provider and validators to promote an equal relationship in the system.

The subscription smart contract SHOULD define the following:

```js

    "SubscriptionContract" : {
        "reserveAddress" : address // the address of the tokenized reserve contract
        "setPrice" : int // set a new price
        "subscriptionStatus": bool // the current subscription status of a user

 } 
    
```

The subscription contract SHOULD be treated as a tokenized reserve [policy](https://eips.ethereum.org/EIPS/eip-7425).

Each review by the analyst agent SHOULD be requested by a subscriber.
The operator decides how to receive requests from subscribers.
Depending on the resources given to the analyst agent,
reviews are not REQUIRED for every request.
The operator MUST be transparent about when a report was generated on a user interface.
In a malicious scenario,
the interface controlled by an operator may present old reports to subscribers.

### Analyst Agent Workflow

The agent workflow MAY be made public to help validators conduct better reports.
This transparency allows the validator to verify that the operator conducted a thorough report.**
The RECOMMENDED analyst agent workflow:

```yaml

name: Analyst Workflow
steps:
 - name: Guard Report Request
    description: |
 Call `get_inputs` validate the analysis request and gather required inputs.
 This returns:
 - `valid_request`
 - `analysis_inputs`
 If `valid_request` is false, stop the workflow.
 Call `check_updates` to include new input information.
 If true, pass `analysis_inputs` to the next step.
    tool: verify_request
 - name: Security Reasoning
    description: |
 Analyze the provided inputs to identify potential vulnerabilities,
 security risks, and relevant findings.
 Use `security_reasoning` to interpret the inputs.
 Continue to the next step.
    tool: security_reasoning
 - name: Check Validators
    description: |
 Iterate the new validator submissions from on-chain references.
 Collect all new value data presented by validators and record valuable validator contributions.
 Add important data to the report.
 Create a timestamped validator rewards attestation.
 Continue to the next step.
    tool: validator_check
 - name: Generate Report
    description: |
 Call `generate_report`
 The report may follow the provided schema and should include:
 - summary
 - vulnerability descriptions
 - risk assessment
 - mitigation recommendations

 End the workflow.
    tool: `generate_report

```

### Tokenized Reserve

The Open Directive system MUST implement a tokenized reserve as the core contract to
manage report submissions.

#### Token Issuance

The tokenized reserve allows users to view the report history chain,
incentives validators to make submissions and
helps lower the submission of spam reports.
The `directiveToken` is the default token for the Open Directive system.
During initialization of the system, the `owner` SHOULD deploy the `directiveToken` at a fixed rate.
Once deployed, the entire amount should be deposited into a liquidity pool creating LP, liquidity pool, tokens.
These tokens MUST be sent to the tokenized reserve.
This will lock the LP tokens in the reserve,
not allowing the `owner` to access.

#### Reporting

Reports are linked together into a history of related submissions.
The report chain is identified with the `proposalNum`.
A record contract address SHOULD be declared on each `proposalOpen`.
The record contract will hold the chain of submissions from validators,
the analyst agent and verifiers.

The `owner` is responsible for assigning one `proposalNum` for each report chain.
If the `owner` does not outline clear `proposalOpen` creation guidelines,
the user's client could not locate the desired latest report.
Also, validators MAY submit new reports to an incorrect `proposalNum`,
which would be an unrelated submission history chain.

The `proposalNum` MUST be used by validators to make `directiveToken` deposits into the reserve when making submissions.

A validator's report MUST be submitted through the `proposalDeposit`.
The `owner` should declare the defined amount per deposit.
For more information on validators, see the following section.

It is RECOMMENDED to create a separate proposal to declare the subscription policy on the Open Directive contract.
All policies SHOULD declare an open `proposalNum` from the tokenized reserve.

### Validators

A validator acts as an independent analyst assisting the analyst agent on improving reports.
Analyst agent reports are not considered 100% correct,
as agents can hallucinate, justify misleading vulnerabilities,
present incorrect vulnerabilities, and make other mistakes.
To be classified as a validator in the system,
a user MUST transfer the `directiveToken` to the opened proposal when the report submission is made.
Validators are in competition to receive rewards that are finalized by the analyst agent.
To prevent validators from submitting duplicate vulnerability reports to the system,
essentially spamming the network,
token deposits SHOULD be used as the winning weight for awarding rewards.
The higher the validator deposits for a `proposalNum`,
the greater the chance the validator will have their approved report rewarded over other approved reports.
The analyst agent must verify that the report is beneficial.
This approach aims to lower spam as each submission needs tokens.
Validators may concentrate token deposits at reports that are popular, get a lot of reports,
or if there are other incentives presented.
This will constrain large token holders to certain report chains,
while smaller token holders can compete in other reporting chains for rewards.

The analyst agent will be given a set of improved reports from validators,
but MAY choose some of that data as inputs for the next generated report.
Future work can introduce pools, where users and
project teams could place extra `directiveToken` rewards to attract more independent reviews to the projects.

The RECOMMENDED information included in validator reports is:

```json

{
  "validator" : "address",
  "proposal" : "integer",

  "reports": [
 {
      "vulnerability_number": "",
      "title": "",
      "severity": "Critical | High | Medium | Low | Informational",
      "contract_address": "",
      "function": "",
      "description": "",
      "impact": "",
      "exploit_scenario": "",
      "recommendation": "",
      "confidence": "High | Medium | Low",
 }
 ]
}

```

Submissions by validators not following an operator's recommendations MAY NOT be considered for reward distributions.
The operator is responsible for these guidelines, and operators can exclude any validator.
These guidelines MAY be updated over time to meet the required constraints.

Submissions are only referenced on-chain with a Keccak-256 hash.
The hash MAY represent any address format referencing the location of the submission.
It is RECOMMENDED that the operator support methods for validators to submit encrypted reports that are retrievable by their analyst agent or other verifier agents.
It is RECOMMENDED to use decentralized storage solutions to store the data.
Validator reports are encrypted
to deter their competition from submitting duplicate findings.

Verifier agents MAY do a review of validator submissions to classify them as valid alongside the main analyst agent.
The verifier SHOULD find duplicate submissions, spam submissions with relevant information,
and any other malicious validator activity.
The system currently does not punish a validator for malicious activity,
so the operator MAY add guidelines to penalize validators.
Users SHOULD NOT have access to validator reports,
as these reports should be verified as not spam or malicious.
Validators aim to assist the operator in creating good analysis reports
while presenting the transparent activity of the system to all participants.

The operator is the orchestrator of all components within the system.
Since it is their responsibility to attract validators and users,
the operator is incentivised to keep the system up to standard.
Reputation plays a large role in attracting future users and validators.
When an operator acts maliciously,
like favoring a few validator reports over others,
the validator has the option to expose the operator.

#### Validator Expose

If a validator notices that their reports are not being rewarded properly,
they can suggest an investigation into the operator.
The tokenized reserve records every activity,
which the validator can utilize to expose the operator of malicious activity.
Once a validator has evidence, they can provide keys to unencrypt their reports.
They also submit an expose flag that other parties MUST be able to view.
Users can then use their own methods to confirm the exposure investigation.
If the investigation is true, the operator's reputation MAY be ruined on-chain through expose reports.
Future work can introduce open-source verifier protocols with incentives.

### Benchmark and RFC

...

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/)

## References

- [ERC7425](https://eips.ethereum.org/EIPS/eip-7425)
