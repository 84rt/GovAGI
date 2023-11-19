import {
    Field,
    SmartContract,
    state,
    State,
    method,
    Poseidon,
    UInt64,
    MerkleWitness,
    CircuitValue,
    prop,
    UInt32,
    MerkleTree,
    isReady,
    CircuitString,
    Circuit
  } from 'o1js';
import {prompts as prompts} from "./prompts/prompts.js"


await isReady;
let initialBalance = 10_000_000_000;

class MyMerkleWitness extends MerkleWitness(8) {}
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

export class Vote extends SmartContract {
    @state(Field) highestScore = State<Field>();
    @state(Field) totalPrompts = State<Field>();
    @state(Field) promptCommitment = State<Field>();
  
    init(){
      super.init();
      this.promptCommitment.set(this.createMerkleTree());
      this.balance.addInPlace(UInt64.from(initialBalance));
    }
  
    createMerkleTree(){
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
    
  
    @method addVote(vote: Field, currentPrompt: Prompt, path: MyMerkleWitness){
      
      let commitment = this.promptCommitment.get(); //the commitment is the same as the root
      this.promptCommitment.assertEquals(commitment);

      // check the initial state matches what we expect
        const rootBefore = path.calculateRoot(Poseidon.hash(currentPrompt.toFields()));
        rootBefore.assertEquals(commitment);

        let newPrompt = new Prompt(currentPrompt.prompt, currentPrompt.numVotes.add(1), currentPrompt.yesVotes.add(UInt32.from(vote)));

  
      // compute the root after incrementing
        const rootAfter = path.calculateRoot(newPrompt.hash());
    
        // set the new root
        this.promptCommitment.set(rootAfter);
    }
}