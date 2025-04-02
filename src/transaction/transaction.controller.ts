import { Body, Controller, Get, Logger, Param, Post, Res, Query } from "@nestjs/common"
import { WalletService } from "../wallet/wallet.service"
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { EncoderFactory } from "../chain/encoder.factory"
import { Crafter } from "../chain/crafter.role"
import { ConfigService } from "@nestjs/config"
import { CrafterFactory } from "../chain/crafter.factory"
import { ApiTags } from "@nestjs/swagger"
import { TransactionService } from "./transaction.service"
import algosdk from "algosdk";
import {sha512_256} from "js-sha512";


// DTO for required parameters
export class CreateAssetRequiredDto {
    @IsString()
    from: string;

    @IsString()
    unit: string;

    @IsNumber()
    @Type(() => Number)
    decimals: number;

    @IsNumber()
    @Type(() => Number)
    totalTokens: number;
}

// DTO for optional parameters
export class CreateAssetOptionalDto {
    @IsString()
    @IsOptional()
    assetName?: string;

    @IsString()
    @IsOptional()
    url?: string;

    @IsBoolean()
    @IsOptional()
    defaultFrozen?: boolean;

    @IsString()
    @IsOptional()
    managerAddress?: string;

    @IsString()
    @IsOptional()
    reserveAddress?: string;

    @IsString()
    @IsOptional()
    freezeAddress?: string;

    @IsString()
    @IsOptional()
    clawbackAddress?: string;
}

// Combined DTO
export class CreateAssetDto extends CreateAssetRequiredDto implements Partial<CreateAssetOptionalDto> {
    assetName?: string;
    url?: string;
    defaultFrozen?: boolean;
    managerAddress?: string;
    reserveAddress?: string;
    freezeAddress?: string;
    clawbackAddress?: string;
}

@ApiTags("Transaction")
@Controller()
export class Transaction {
    constructor(private readonly walletService: WalletService, private readonly configService: ConfigService, private readonly txnService: TransactionService) {}


    @Post("payment")
    async makePayment(@Body() body: { from: string, to: string, amt: number }): Promise<{txnId:string}> {
        const amount = Number(body.amt)
        return await this.txnService.makePayment(body.from, body.to, amount)
        // return await this.txnService.makePayment('test', 'VYG6BEXIW7YKJW3X5MUMYWZU226IPFIJLBZYQJ3FRWMRNR4IT7Q6TIAFWA', 1000)

    }

    @Post("asset")
    async createAsset(@Body() body: CreateAssetDto): Promise<{ assetId: string}> {

        const decimals = Number(body.decimals)
        const totalTokens = Number(body.totalTokens)

        let defaultFrozen = false;
        if (body.defaultFrozen !== undefined) {
            // If it's already a boolean, use it directly
            if (typeof body.defaultFrozen === 'boolean') {
                defaultFrozen = body.defaultFrozen;
            } 
            // If it's a string 'true' or 'false', convert appropriately
            else if (typeof body.defaultFrozen === 'string') {
                defaultFrozen = body.defaultFrozen === 'true';
            }
        }

        const params = {
            assetName: body.assetName,
            url: body.url,
            defaultFrozen: defaultFrozen,
            managerAddress: body.managerAddress,
            reserveAddress: body.reserveAddress,
            freezeAddress: body.freezeAddress,
            clawbackAddress: body.clawbackAddress
        }

        console.log(params);
        

        return await this.txnService.asset(body.from, body.unit, decimals, totalTokens, params)
        
        // const assetId = await this.txnService.asset('test', 'kavya', 0, 1, { assetName: 'test', url: 'http://test.com', defaultFrozen: false, 
        //     managerAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M', 
        //     reserveAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M', 
        //     freezeAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M', 
        //     clawbackAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M' })

        // return assetId
    }

    @Post("asset-transfer")
    async transferAsset(@Body() body: { assetId: number, from: string, to: string, amount: number }): Promise<{ txnId: string, error:string }> {

        const assetId = Number(body.assetId)
        const amount = Number(body.amount)

        return await this.txnService.transferToken(assetId, body.from, body.to, amount)

        // return { txnId : await this.txnService.transferToken(734471494, 'test ', 'V5LR6C5SVHBQY3SPTEPD5WEGNBBUDNEP2MSDIONQIODZXZHRMC6QF3CTZI', 1)}
    }

    @Post("opt-in-asset")
    async optInAsset(@Body() body: { assetId: number, from: string }): Promise<{ txnId: string }> {
        const assetId = Number(body.assetId)    
    
        return await this.txnService.optInAsset(assetId, body.from)
        // return { txnId : await this.txnService.optInAsset(734469357, 'test1')}
    }

    @Post("opt-out-asset")
    async optOutAsset(@Body() body: { assetId: number, from: string, close: string }): Promise<{ txnId: string }> {
        const assetId = Number(body.assetId)    
    
        return await this.txnService.optOutAsset(assetId, body.from, body.close)
    }

    /**
     * Creates a transaction group with multiple transaction types in the specified order
     */
    @Post("group-transaction")
    async groupTransaction(@Body() body: { 
        from: string, 
        transactions: Array<{
            type: 'payment' | 'application' | 'asset-transfer' | 'asset-create',
            params: any
        }>
    }): Promise<{ txnId: string, error: string }> {
        return await this.txnService.groupTransaction(
            body.from,
            body.transactions
        );
    }

    /**
     * Example of a group transaction with payment and asset transfer
     * This demonstrates how to create a predefined group transaction
     */
    @Post("example-group-transaction")
    async exampleGroupTransaction(@Body() body: { 
        from: string,
        receiverAddress: string,
        amount: number,
        assetId: number
    }): Promise<{ txnId: string, error: string }> {
        // Create a group transaction with two transactions:
        // 1. A payment transaction
        // 2. An asset transfer transaction
        
        const transactions = [
            {
                type: 'payment' as const,
                params: {
                    to: '5OD3JPPNBR2PYDCB2I2XJVW7FVPA7A6ECM3GXG5H6OOIG2HJLMS7SSPFKI',//body.receiverAddress,
                    amount: 202000//body.amount
                }
            },
            {
                type: 'application' as const,
                params: {
                    appIndex: 736444345,
                    appArgs: [new Uint8Array(sha512_256.array(Buffer.from("opt_in_to_asset(pay)void")).slice(0, 4))],
                    // accounts: ['5OD3JPPNBR2PYDCB2I2XJVW7FVPA7A6ECM3GXG5H6OOIG2HJLMS7SSPFKI'],
                    foreignAssets: [735261053]
                }
            }
        ];
        
        return await this.txnService.groupTransaction(
            'test',
            transactions
        );

        return await this.txnService.groupTransaction(
            body.from,
            transactions
        );
    }

   @Post('application-call')
   async applicationCall(@Body() body: { from: string, 
    approvalProgram?: string, 
    clearProgram?: string, 
    globalSchema?: { numByteSlice: number, numUint: number }, 
    localSchema?: { numByteSlice: number, numUint: number } , 
    appIndex?: number, 
    appArgs?: Array<Uint8Array>, 
    foreignApps?: Array<number>, 
    foreignAssets?: Array<number>,
    accounts?: Array<string>
    }
    ): Promise<{ txnId: string, error: string }> {



        // Participation Token Application Call
        return await this.txnService.applicationCall('test', 0,
            'CiADAAEEJgEIYXNzZXRfaWSABG6nG1OABBV0U1qABCIZu6eABPFXdyaABDOzSZ42GgCOBQABABYALAA4AEQAMRkURDEYFEQ2GgEXNhoCF4gAPiNDMRkURDEYRDEWIwlJOBAjEkSIAD0jQzEZFEQxGESIAGQjQzEZFEQxGESIAH0jQzEZgQUSRDEYRIgAiCNDigIAKIv+Z4AIcXVhbnRpdHmL/2eJigEAMQAyCRJEMgoiKGVEcABFARREi/84BzIKEkSxIihlRDIKIrISshSyESSyECKyAbOJigAAMQAiKGVEcABFARREsSIoZUQxACKyErIUshEkshAisgGziYoAALEiKGVEMQAjshKyFLIRJLIQIrIBs4mKAAAxADIJEkSxIihlRDIJSbIVIrISshSyESSyECKyAbOxMglJsgkisgiyByOyECKyAbOJ',
            'CoEBQw==', 
            { numByteSlice: 0, numUint: 2 }, { numByteSlice: 0, numUint: 0 },
            [new Uint8Array(sha512_256.array(Buffer.from("create_application(uint64,uint64)void")).slice(0, 4)), algosdk.encodeUint64(735261053), algosdk.encodeUint64(1) ], 
            [], []
            );

        // var {txnId, error} = await this.txnService.makePayment('test', '5OD3JPPNBR2PYDCB2I2XJVW7FVPA7A6ECM3GXG5H6OOIG2HJLMS7SSPFKI', 202000)


        // return await this.txnService.applicationCall('test', 736444345,
        //     null,
        //     null, 
        //     null, null,
        //     [new Uint8Array(sha512_256.array(Buffer.from("opt_in_to_asset(pay)void")).slice(0, 4)), Buffer.from("EJVPKD4RQELEMZ7D4W756LORLPBH6OBN773URZXAS22WPRLZW6OQ")], 
        //     [], [735261053],
        //     ['SEHSPKLFLP55PHXKKZPXAZ5DFE7DDBH3BHPVTRRKIEYCBJOJWTE4V42HLI']
        //     );

        // For all other application calls, use the standard method
        return await this.txnService.applicationCall(
            body.from, 
            body.appIndex??0, 
            body.approvalProgram??'', 
            body.clearProgram??'', 
            body.globalSchema??{ numByteSlice: 0, numUint: 0 }, 
            body.localSchema??{ numByteSlice: 0, numUint: 0 }, 
            body.appArgs??[], 
            body.foreignApps??[], 
            body.foreignAssets??[],
            body.accounts??[]
        )


    }

}
