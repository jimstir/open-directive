/* Compile contract

verify that it is a web3 application, or application 
Step 1: Extract:
-AST
-ABI
-bytecode
-dependency graph

compile contracts
run tests( hardhat fuzzing?)
simulate blockchain environments

Step 2: Static Analysis + Symbolic Execution

Static Analysis: Slither - output to json
Symbolic Execution: Mythril - output to json

Step 3: Exploit simluation??**

Step 4: LLM reasoning based on inputs

Inputs:
- static analysis output
-fuzz results
- symbolic execution traces
- contract AST

AI tasks:
- Filter false positives
- Explain vulnerabilities
- Detect logical exploits
- Suggest fixes
- Prioritize risk

Step 5:
Generate report based on schema

LLM Reasoing Goals:
understand protocol architecture
find economic attacks
find business logic flaws
find governance vulnerabilities


Agents are useful when:

- workflows change dynamically
- new tools need to be selected
- analysis paths vary

Example:
If contract is upgradeable → run proxy analysis
If protocol uses oracle → run oracle checks
If governance exists → analyze voting logic


*/
