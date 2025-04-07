import { ConfigService } from "@nestjs/config"
import { Crafter } from "./crafter.role"
import { AlgorandTransactionCrafter } from '@algorandfoundation/algo-models'
import { AssetCreateTxBuilder, IAssetCreateTxBuilder } from "./asset.create"
import { AssetTransfer, AssetTransferTxBuilder, IAssetTransferTxBuilder } from "./asset.transfer"
import { ApplicationTxBuilder } from "./application.transaction"
import { GroupTransactionBuilder, IGroupTransactionBuilder } from "./group.transaction"
import { PaymentTxBuilder, IPaymentTxBuilder } from "./payment.transaction"


export class AlgoTxCrafter extends AlgorandTransactionCrafter {
	constructor(private readonly genesisIdCrafter: string, private genesisHashCrafter: string, private readonly configService: ConfigService) {
		super(genesisIdCrafter, genesisHashCrafter)
	}

	/**
	 * Create a payment transaction using our custom PaymentTxBuilder
	 * @param from Sender address
	 * @param to Receiver address
	 * @param amount Amount in microAlgos
	 * @param firstRound First valid round
	 * @param lastRound Last valid round
	 * @returns Payment transaction builder
	 */
	payment(from: string, to: string, amount: number, firstRound: number, lastRound: number): IPaymentTxBuilder {
		return new PaymentTxBuilder(this.genesisIdCrafter, this.genesisHashCrafter)
			.addSender(from)
			.addReceiver(to)
			.addAmount(amount)
			.addFee(1000)
			.addFirstValidRound(firstRound)
			.addLastValidRound(lastRound);
	}

	assetTransfer(assetId: number, from: string, to: string, amount: number | bigint): IAssetTransferTxBuilder {
		return new AssetTransferTxBuilder(this.genesisIdCrafter, this.genesisHashCrafter, assetId, from, to, amount)
			.addFee(1000)
	}

	asset(from: string, unit: string, decimals: bigint, totalTokens: number, firstRound:number, lastRound:number, defaultFrozen : boolean): IAssetCreateTxBuilder {
		
		const assetBuilder =  new AssetCreateTxBuilder(this.genesisIdCrafter, this.genesisHashCrafter, decimals, totalTokens)
			.addSender(from)
			.addFee(1000)
			.addFirstValidRound(firstRound)
			.addLastValidRound(lastRound)
			.addUnit(unit)
			.addTotalTokens(totalTokens)

			if(decimals){
				assetBuilder.addDecimals(decimals)
			}

			if(defaultFrozen){
				assetBuilder.addDefaultFreeze(defaultFrozen)
			}
		return assetBuilder;	
	}

	applicationCall(from: string, 
		approvalProgram: Uint8Array, 
		clearProgram: Uint8Array,
		appArgs: Array<Uint8Array>,
		globalSchema: { numByteSlice: number, numUint: number }, 
		localSchema: { numByteSlice: number, numUint: number }, 
		firstRound:bigint, 
		lastRound:bigint,
		foreignApps: Array<number>,
		foreignAssets: Array<number>,
		appIndex: bigint,
		fee: number,
		accounts?: Array<string>): any {			
		const applicationBuilder = new ApplicationTxBuilder(this.genesisIdCrafter, this.genesisHashCrafter)
		.addSender(from)
		.addFee(BigInt(fee))
		.addFirstValidRound(firstRound)
		.addLastValidRound(lastRound)

		// Check if approvalProgram is defined and not empty
		if(approvalProgram && approvalProgram.byteLength > 0) {
			applicationBuilder.addApprovalProgram(approvalProgram)
		}
		
		// Check if clearProgram is defined and not empty
		if(clearProgram && clearProgram.byteLength > 0) {
			applicationBuilder.addClearProgram(clearProgram)
		}
		
		// Check if appArgs array exists and is not empty
		if(appArgs && Array.isArray(appArgs) && appArgs.length > 0) {
			applicationBuilder.addApplicationArgs(appArgs)
		}

		// Check and add global schema if provided and valid
		if(globalSchema && typeof globalSchema === 'object') {
		if(globalSchema.numByteSlice > 0) {
			applicationBuilder.addGlobalSchemaByteSlice(globalSchema.numByteSlice)
		}

		if(globalSchema.numUint > 0) {
			applicationBuilder.addGlobalSchemaUint(globalSchema.numUint)
		}
		}

		// Check and add local schema if provided and valid
		if(localSchema && typeof localSchema === 'object') {
		if(localSchema.numByteSlice > 0) {
			applicationBuilder.addLocalSchemaByteSlice(localSchema.numByteSlice)
		}

		if(localSchema.numUint > 0) {
			applicationBuilder.addLocalSchemaUint(localSchema.numUint)
		}
		}

		// Check and add foreign apps if provided and valid
		if(foreignApps && Array.isArray(foreignApps) && foreignApps.length > 0) {
			applicationBuilder.addForeignApps(foreignApps)
		}

		// Check and add foreign assets if provided and valid
		if(foreignAssets && Array.isArray(foreignAssets) && foreignAssets.length > 0) {
			applicationBuilder.addForeignAssets(foreignAssets)
		}	

		// Check and add accounts if provided and valid
		if(accounts && Array.isArray(accounts) && accounts.length > 0) {
			applicationBuilder.addAccounts(accounts)
		}

		// Check and add application ID if provided
		if(appIndex && appIndex > 0n) {
			applicationBuilder.addApplicationId(appIndex)
		}	

		return applicationBuilder;
	}

	groupTransaction(from: string, firstRound: bigint, lastRound: bigint, transactions: Array<any>): any {

		const groupBuilder = new GroupTransactionBuilder(this.genesisIdCrafter, this.genesisHashCrafter)
		.addSender(from)
		// .addFee(5000n)
		.addFirstValidRound(firstRound)
		.addLastValidRound(lastRound)
		.addTransactions(transactions)
		return groupBuilder;
	}
}

export class CrafterFactory {
	static getCrafter(chain, configService: ConfigService): any {
		switch (chain) {
			case "algorand":
				const genesisId: string = configService.get<string>("GENESIS_ID")
				const genesisHash: string = configService.get<string>("GENESIS_HASH")
				return new AlgoTxCrafter(genesisId, genesisHash, configService)
			default:
				throw new Error("Chain not supported")
		}
	}
}
