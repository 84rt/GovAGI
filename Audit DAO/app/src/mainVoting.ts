/*
Description: 

This example describes how developers can use Merkle Trees as a basic off-chain storage tool.

zkApps on Mina can only store a small amount of data on-chain, but many use cases require your application to at least reference big amounts of data.
Merkle Trees give developers the power of storing large amounts of data off-chain, but proving its integrity to the on-chain smart contract!


! Unfamiliar with Merkle Trees? No problem! Check out https://blog.ethereum.org/2015/11/15/merkling-in-ethereum/
*/

import {
    isReady,
    Poseidon,
    Field,
    CircuitValue,
    prop,
    Mina,
    UInt32,
    PrivateKey,
    AccountUpdate,
    MerkleTree,
    MerkleWitness,
    shutdown,
    CircuitString,
  } from 'o1js';
  import { Vote } from './Vote.js';

  import question from "./question.js";
  import {prompts as prompts} from "./prompts/prompts.js"
  
  
  await isReady;
  
  const doProofs = true;
  
  class MyMerkleWitness extends MerkleWitness(8) {}
  
  // we need the initiate tree root in order to tell the contract about our off-chain storage
  let initialPromptCommitment: Field = Field(0);
  
  let initialBalance = 10_000_000_000;
  
  
  const promptTree = new MerkleTree(8);

class Prompt extends CircuitValue {
    @prop prompt: CircuitString;
    @prop numVotes: UInt32;
    @prop yesVotes: UInt32;
  
    constructor(prompt: CircuitString, numVotes: UInt32, yesVotes: UInt32) {
      super(prompt, numVotes, yesVotes);
      this.prompt = prompt;
      this.numVotes = numVotes;
      this.yesVotes = yesVotes;
    }
  
    hash(): Field {
      return Poseidon.hash(this.toFields());
    }
}

// export class Vote extends SmartContract {
//     @state(Field) highestScore = State<Field>();
//     @state(Field) totalPrompts = State<Field>();
//     @state(Field) promptCommitment = State<Field>();

//     // deploy(args: DeployArgs) {
//     //     super.deploy(args);
//     //     this.setPermissions({
//     //       ...Permissions.default(),
//     //       editState: Permissions.proofOrSignature(),
//     //     });
//     //     this.totalPrompts.set(Field(100));
//     //     this.balance.addInPlace(UInt64.from(initialBalance));
//     // }
  
//     init(){
//       super.init();
//       this.promptCommitment.set(this.createVoteMerkleTree());
//       this.balance.addInPlace(UInt64.from(initialBalance));
//     }
  
//     createVoteMerkleTree(){
//       let committment: Field = Field(0);
    
//       let Prompts: Map<number, Prompt> = new Map<number, Prompt>();

//       for(let i in prompts){
//           let thisPrompt = new Prompt(CircuitString.fromString(prompts[i].prompt), UInt32.from(prompts[i].numVotes), UInt32.from(prompts[i].yesVotes));
//           Prompts.set(parseInt(i), thisPrompt);
//           promptTree.setLeaf(BigInt(i), thisPrompt.hash());
//       }
    
//       // now that we got our accounts set up, we need the commitment to deploy our contract!
//       committment = promptTree.getRoot();
//       return committment;
//     }
    
  
//     @method addVote(vote: Field, currentPrompt: Prompt, path: MyMerkleWitness){
      
//       let commitment = this.promptCommitment.get(); //the commitment is the same as the root
//       this.promptCommitment.assertEquals(commitment);

//       // check the initial state matches what we expect
//         const rootBefore = path.calculateRoot(Poseidon.hash(currentPrompt.toFields()));
//         rootBefore.assertEquals(commitment);

//         let newPrompt = new Prompt(currentPrompt.prompt, currentPrompt.numVotes.add(1), currentPrompt.yesVotes.add(UInt32.from(vote)));

  
//       // compute the root after incrementing
//         const rootAfter = path.calculateRoot(newPrompt.hash());
    
//         // set the new root
//         this.promptCommitment.set(rootAfter);
//     }
// }
  
  

  
  
  
  
  

  function createVoteMerkleTree(){
    let committment: Field = Field(0);
  
    let Prompts: Map<number, Prompt> = new Map<number, Prompt>();

    for(let i in prompts){
        let thisPrompt = new Prompt(CircuitString.fromString(prompts[i].prompt), UInt32.from(prompts[i].numVotes), UInt32.from(prompts[i].yesVotes));
        Prompts.set(parseInt(i), thisPrompt);
        promptTree.setLeaf(BigInt(i), thisPrompt.hash());
    }
  
    // now that we got our accounts set up, we need the commitment to deploy our contract!
    committment = promptTree.getRoot();
    return committment;
  }
  
  
  
  
  (async function main (){
  
  
  let Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  
  let feePayer = Local.testAccounts[0].privateKey;

  
  
  // the zkapp account
  let zkappKey = PrivateKey.random();
  let zkappAddress = zkappKey.toPublicKey();
  
  initialPromptCommitment = createVoteMerkleTree();
  
  
   let voteApp = new Vote(zkappAddress);

  
  try{
   
    console.log('Compiling VoteApp..');
  
    if (doProofs) {
        await Vote.compile();
    }
    console.log('Deploying VoteApp..');
    
    let tx = await Mina.transaction(feePayer, () => {
      AccountUpdate.fundNewAccount(feePayer, { initialBalance });
        voteApp.deploy({ zkappKey });
    });
  
    await tx.send();
    console.log('quizapp deployed')
    console.log(voteApp.promptCommitment.get());
  
  }catch(e){
    console.log(e);
  }
  
  
    
  
  
   // ----------------------------------------------------
   for(let j in prompts){
        var response = parseInt((await question(prompts[j].prompt)).trim());
        let promptW = promptTree.getWitness(BigInt(j));
        let promptWitness = new MyMerkleWitness(promptW);
    
        try{
            let txn = await Mina.transaction(feePayer, () => {
                voteApp.addVote(Field(j),
                    new Prompt(
                        CircuitString.fromString(prompts[j].prompt),
                        UInt32.from(prompts[j].numVotes),
                        UInt32.from(prompts[j].yesVotes)
                        ),
                    promptWitness);
                //  voteApp.sign(zkappKey);
    
            });
            console.log(`Proving blockchain transaction for question ${j}\n`)
            if (doProofs) {
                 await txn.prove();
               }
               console.log(`Sending blockchain transaction for question ${j}\n`)
            await txn.send();
            console.log('Voted');
        }
        catch(e){
            console.log("You encountered the following error: "+e);
            console.log("Ending Prompt Votes");
            break;
        }
        
       }
    // ---------------
   var retry = true;
   var retryCount = 0;
   
   shutdown();
  
   
  
  })();
  
  