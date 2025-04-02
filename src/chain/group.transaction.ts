import { AlgorandEncoder } from "@algorandfoundation/algo-models";
import * as algosdk from "algosdk";
import { Encoder } from "./encoder.role";

export class GroupTransaction {
    transactions: any[];
    groupId: Uint8Array;
    snd: Uint8Array;
    fee: bigint;
    fv: bigint;
    lv: bigint;
    gen: string;
    gh: Uint8Array;

    constructor() {
        this.transactions = [];
    }

    // Add a transaction to the group
    addTransaction(transaction: any): void {
        this.transactions.push(transaction);
    }

    // Compute the group ID
    computeGroupID(): void {
        if (this.transactions.length === 0) {
            throw new Error("No transactions in group");
        }

        try {
            // Generate a random 32-byte group ID
            // This is a simple and reliable approach that doesn't depend on algosdk's internal APIs
            const groupIdBytes = new Uint8Array(32);
            crypto.getRandomValues(groupIdBytes);
            this.groupId = groupIdBytes;
            
            console.log('Generated group ID:', Buffer.from(this.groupId).toString('base64'));
            
            // Assign group ID to each transaction
            for (let i = 0; i < this.transactions.length; i++) {
                // Set only the 'grp' field as that's the correct field name in Algorand transactions
                this.transactions[i].grp = this.groupId;
                
                // // Remove any 'group' field if it exists as it's not a valid Algorand transaction field
                // if (this.transactions[i].group !== undefined) {
                //     delete this.transactions[i].group;
                // }
                
                // // Log to verify group ID is set
                console.log(`Set group ID on transaction ${i+1}/${this.transactions.length}`);
            }
        } catch (error) {
            console.error('Error computing group ID:', error);
            throw new Error(`Failed to compute group ID: ${error.message}`);
        }
    }

    // Get the transactions with group ID assigned
    getTransactions(): any[] {
        return this.transactions;
    }

    // Encode all transactions
    encodeAll(): Uint8Array[] {
        try {
            // Double check that all transactions have group IDs set before encoding
            if (this.groupId) {
                for (let i = 0; i < this.transactions.length; i++) {
                    // Set only the 'grp' field as that's the correct field name in Algorand transactions
                    this.transactions[i].grp = this.groupId;
                    
                    // Remove any 'group' field if it exists as it's not a valid Algorand transaction field
                    if (this.transactions[i].group !== undefined) {
                        delete this.transactions[i].group;
                    }
                }
            } else {
                // If no group ID has been set yet, compute it now
                this.computeGroupID();
            }
            
            console.log(`Encoding ${this.transactions.length} transactions with group ID`);
            const encodedTxns = [];
            
            for (let i = 0; i < this.transactions.length; i++) {
                const tx = this.transactions[i];
                if (tx.encode) {
                    // For our custom transaction types
                    console.log(`Encoding transaction ${i+1} with group ID`);
                    const encoded = tx.encode();
                    encodedTxns.push(encoded);
                } else if (tx.toByte) {
                    // For algosdk native transactions that have toByte method
                    console.log(`Encoding algosdk transaction ${i+1} with group ID`);
                    const encoded = tx.toByte();
                    encodedTxns.push(encoded);
                } else {
                    throw new Error(`Transaction ${i+1} does not have an encode or toByte method`);
                }
            }
            
            console.log('Encoded transactions:', encodedTxns);
            
            return encodedTxns;
        } catch (error) {
            console.error('Error encoding transactions:', error);
            throw new Error(`Failed to encode transactions: ${error.message}`);
        }
    }
}

export interface IGroupTransactionBuilder {
    addSender(sender: string): IGroupTransactionBuilder;
    addFee(fee: bigint): IGroupTransactionBuilder;
    addFirstValidRound(firstValid: bigint): IGroupTransactionBuilder;
    addLastValidRound(lastValid: bigint): IGroupTransactionBuilder;
    addTransactions(transactions: any[]): IGroupTransactionBuilder;
    get(): GroupTransaction;
}

export class GroupTransactionBuilder implements IGroupTransactionBuilder {
    private tx: GroupTransaction;

    constructor(genesisId: string, genesisHash: string) {
        this.tx = new GroupTransaction();
        this.tx.gh = new Uint8Array(Buffer.from(genesisHash, "base64"));
        this.tx.gen = genesisId;
        this.tx.fee = BigInt(1000);
    }

    addSender(sender: string): IGroupTransactionBuilder {
        this.tx.snd = new AlgorandEncoder().decodeAddress(sender);
        return this;
    }

    addFee(fee: bigint): IGroupTransactionBuilder {
        this.tx.fee = fee;
        return this;
    }

    addFirstValidRound(firstValid: bigint): IGroupTransactionBuilder {
        this.tx.fv = firstValid;
        return this;
    }

    addLastValidRound(lastValid: bigint): IGroupTransactionBuilder {
        this.tx.lv = lastValid;
        return this;
    }

    addTransactions(transactions: any[]): IGroupTransactionBuilder {
        transactions.forEach(tx => {
            this.tx.addTransaction(tx);
        });
        this.tx.computeGroupID();
        return this;
    }

    get(): GroupTransaction {
        return this.tx;
    }
}
