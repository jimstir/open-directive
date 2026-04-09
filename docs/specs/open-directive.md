---
title: OPEN-DIRECTIVE
name: Open Directive
status: draft
category: Best Current Practice
contributors: Jimmy <@jimstir>

---

## Abstract

This document describes the Open Directive protocol.
The protocol defines a mechanism to report and verify web3 application security analysis.

## Background/Motivation

Web3 applications are facing the grow problem of safety from their services.
Applications with resoruces conduct smart contract audits before launching the service,
but these applications are still open to expliots.

The Open Directive brings security directly to the user of the application.
The user shouldn't have to believe some service that the proper security audits have been conducted.
Instead, the user could verify for themselves, even non-techincal users.
Security analyst reports are submited on a blockchain to help with transparency.
Validators are users, a white hat security reseasher,
that help improve these reports by submitting improvement reports.
If a validator believes that the analyst agent submitted a analysis that are incorrect, missing information, or need any other improvements,
they can submit their improvement on-chain.
A toeknized reserve, [ERC7425](https://eips.ethereum.org/EIPS/eip-7425),
is used to help facilate the relationship between validators and the anaylst agent.
As new security incidents occur every season, this relationship between automated reproting and
human validator reporting can improve how users protect themselves within the fast change web3 landscape.

### Terminology

- `owner`: The defined address on the tokenized reserve.
- provider: The owner of the agent resoources being offered to the service.
- validator: A white hat security researcher submiting security reports.
- `directiveToken`: The token assigned to the ERC7425 reserve.

## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in
[RFC 2119](http://tools.ietf.org/html/rfc2119).

The system uses a LLM, large language model, for reasioning to generate security anaylsis reports.
This reproting is done by the anaylst agent.
The provider SHOULD provide the anaylst agent with a set of tools to contruct the reports.
Security anaylsis reports MAY not be 100% percent accurate,
so users in the system keep this in mind.
Also, a provider MAY provide what tools are being used to generate inputs for the agent,
but the system does not verify this.
This means even if the `provider` shares some information,
the provider is free to make changes at any time without sharing the details of the updates.

The Open Directive has users become subscribers by paying a subscription fee on-chain through a smart contract.
A user SHOULD have a subscription before sending a request or
having access to reports in the system.
This MUST be enforced by the `provider` and is RECOMMENDED to implement for the subscription system.
This specifcation assumes that subscriptions are enforced.
If not enforced, the system could be effected by spam reports,
lack of incentives to imporve reports and
the potential missed opportunity in the system to understand which applications have the most demand for new reports.
To implement, it is RECOMMENDED to encrypt data before submission.
For information on submission see the [tokenized reserve](#tokenized-reserve) section.

### Subscription

All subscription fees SHOULD be collected on the subscription contract.
Fees are deposited in monthly sets/rounds/..
THe `owner` has access to 50% f each monthly rounds/sets/recurring.

The subscription smart contract SHOULD define the following:

```js

    "SubscriptionContract" : {
        "reserveAddress" : address
        "setPrice" : int // set a new price
        "subscriptionStatus": bool // the current subscription status of a user

    } 
    
```

The subscribtion contract SHOULD be treated as a tokenized reserve [policy](#na) and
define the `reserveAddress` making it public.

Each review by the anaylst agent SHOULD be requested by a subscriber.
Subscribers MAY use a local client to make requests or
providers can implement automatic review mechanisms.
Depending on the resources given to the anaylst agent,
reviews are not REQUIRED for every user visit.
It is up to the `provider` to provide information about how reviews are conducted.

### Analyst Agent WorkFlow

The analyst agent RECOMMENDED workflow:

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
      Continue to next step.
    tool: security_reasoning
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

The Open Directive MUST implement a tokenized reserve to
manages each all the report submissions.
The tokenized reserve allows user to view the reporting chain,
incentives validators with a fair reward metric and
helps lower the submission of spam reports.

Each web3 application that is given a `proposalNum` using the `proposalOpen`.
A record contract address SHOULD be defined.
The record contract will hold the chain of submissions from validators, the anaylst agent and verifiers.
Since the address is defined in the tokenized reserve,
users MUST be able to directly access this information.

The `owner` is responsible for assigning one `proposalNum` for each application.
If the `owner` does not outline clear `proposalOpen` guidelines,
user clients MAY not receive the correct latest reports.
Also validators MAY submit new reports to a `proposalNum` that did not get any review requests.

The opened proposal will manage validator deposits.
Validator's report MUST be submited with a `proposalDeposit` of a predefined amount of the `directiveToken`.
For more information on validators, see the following section.

A separate proposal is RECOMENDED to be created define the subscription policy for the Open Directive.
All policies SHOULD define a opened proposalNum from the tokenized reserve.

### Validators and Verifiers

A validator acts as a white hat security researcher assiting the analyst agent on improving reports.
Analyst agent reports are not considered 100% correct,
as agents can hallucinate, justify misleading vulnerabilities,
present incorrect vulnerabilities, and other mistakes.
A verifier agent is a provider resource that publicly shares the open source tools it uses to verify that a validator submission is valid.
To be classified as a validator in the system,
a user MUST transfer the `directiveToken` to the opened proposal a report submission will be made for.
Validators are in competition to recieve rewards for report submissions.
To prevent validators from submitting duplicate vunderability reports to the system,
token deposits SHOULD be used as winning weight for awarding rewards.
The more the validator deposits for a `proposalNum`,
the higher chance the validator of having their approved report rewarded over others.
This helps lower spam as each submission needs tokens.
Validators with lower resources can win rewards in request that are less popoular,
meaning the larger validator would not put resources towards it.
The analyst agent will be given a set of improved reports from validators,
but will choose some data as inputs for the next report request.
Future work will introduce pools, where users and devlopers could place any amount of `directiveToken` owned by a proposal to support higher rewards and better quaility reports from validators.

The RECOMMENDED information included in validator reports are:

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

Submissions not following a known format MAY NOT BE considered for reward distributions.
The format MAY be updated over time to meet the required constraints.

Submissions are only referenced on-chain with a Keccak-256 hash.
The hash MAY represent of any address format referencing location of the submission.
It is RECOMMENDED that the `provider` have methods for validators to submit encrypted reports that are retrieveable by the verifier agent and the analyst agent.
It is RECOMMENDED to use protocols like IPFS to store the CID,
content identifers, for each report submitted by all roles.
When validator reports are encrypted,
this deteurs the validator's competition from submitting duplicate findings.

Verifier agents SHOULD do a review of validator submission to classify them as valid.
The verifier SHOULD find duplicate submissions, spam submission with releavant information,
and any other malicious validator activity.
The system currently does not punish a validator for malicious activity,
so punishing a validator is the resposiblity of the provider.
User's SHOULD NOT have access to validator reports,
as these reports should be verifed to not display unneccary information to the user.
Validators are meant to assist the `provider` in creating good security analysis,
while displaying transparent activity to the user that there is validators participating.

The `provider` is the orchrator of all components within the system,
as it is required for them to attract users.
The `provider` is incentives to conduct the system to standard as the reputation plays a large role in attracting future users and validator help.
When a provider acts maliciously,
like favoring some validator reports over others,
the validator has the option to `expose the provider.

#### Validator Expose

When a validator notices that their reports are not getting rewarded properly,
they can do an investegation in the open directive system.
The tokenized reserve records every activity,
which the validator can utilize to see if the `provider` is malicious.
Once a validator has evidence, they can provide keys to unencrypt their reports.
They also submit an expose flag that users SHOULD be able to view.
Users can then use their own verifier shared from the publicly known open source tooling,
to confirm the expose report.
Future work can include this verifier with the client, so users do not need to conduct this themselves.

### Fee distributions

Clients SHOULD pay a subscription fee to use the system.
A subscription is paid to a policy controlled by the reserve based on a price decided by the owner.
The collection of fees SHOULD be equally distributed between the provider and validators as they are contributing equally to the service.

The 50% validator portion is also distributed by the provider.
It is the resposiblitiy for the provider to distribute token fairly,
as validators hold the power to `expose which could lead to losing subscribers.
All distribution SHOULD be conducted in a policy owned by the reserve keep activity open to all roles in the system.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/)

## References

- [ERC7425](https://eips.ethereum.org/EIPS/eip-7425)
