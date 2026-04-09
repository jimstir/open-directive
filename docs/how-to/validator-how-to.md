# Validator how-To

```js
{
  "vulnerability_id": "",
  "title": "",
  "severity": "Critical | High | Medium | Low | Informational",
  "contract": "",
  "function": "",
  "description": "",
  "impact": "",
  "exploit_scenario": "",
  "recommendation": "",
  "confidence": ""
}

```

# Smart Contract Security Report

## Vulnerability: Reentrancy in withdraw()

Severity: Critical

Description:
The withdraw() function performs an external call before updating the user balance.

Impact:
An attacker can repeatedly call withdraw() and drain funds.

Exploit Scenario:
1. Attacker deposits funds
2. Calls withdraw()
3. Reenters before balance update

Recommendation:
Use the checks-effects-interactions pattern or ReentrancyGuard.

Real reports includeL:
Summary
Scope
Risk Overview
Findings
Detailed Vulnerabilities
Recommendations

## Expose Flag