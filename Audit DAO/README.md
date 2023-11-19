### How to Run
#### Running from Terminal
`cd app`

`npm install` (if running for the first time)

##### Running on Local Mina Node
`npm run build && node build/src/mainVoting.js`

Notes
- prompts are stored in Merkle trees since Mina state can only have 8 variables
- user votes with Mina thus keeping their identity private
- works on localhost