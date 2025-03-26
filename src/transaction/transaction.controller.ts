import { Body, Controller, Post } from "@nestjs/common";
import { WalletService } from "../wallet/wallet.service";
import { IsString, IsNumber, IsOptional, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";

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
export class CreateAssetDto
  extends CreateAssetRequiredDto
  implements Partial<CreateAssetOptionalDto>
{
  assetName?: string;
  url?: string;
  defaultFrozen?: boolean;
  managerAddress?: string;
  reserveAddress?: string;
  freezeAddress?: string;
  clawbackAddress?: string;
}

@ApiTags("Transaction")
@Controller("transaction")
export class Transaction {
  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly txnService: TransactionService
  ) {}

  @Post("payment")
  async makePayment(
    @Body() body: { from: string; to: string; amt: number }
  ): Promise<{ txnId: string }> {
    const amount = Number(body.amt);
    return await this.txnService.makePayment(body.from, body.to, amount);
    // return await this.txnService.makePayment('test', 'VYG6BEXIW7YKJW3X5MUMYWZU226IPFIJLBZYQJ3FRWMRNR4IT7Q6TIAFWA', 1000)
  }

  @Post("asset")
  async createAsset(
    @Body() body: CreateAssetDto
  ): Promise<{ assetId: string }> {
    const decimals = Number(body.decimals);
    const totalTokens = Number(body.totalTokens);

    let defaultFrozen = false;
    if (body.defaultFrozen !== undefined) {
      // If it's already a boolean, use it directly
      if (typeof body.defaultFrozen === "boolean") {
        defaultFrozen = body.defaultFrozen;
      }
      // If it's a string 'true' or 'false', convert appropriately
      else if (typeof body.defaultFrozen === "string") {
        defaultFrozen = body.defaultFrozen === "true";
      }
    }

    const params = {
      assetName: body.assetName,
      url: body.url,
      defaultFrozen: defaultFrozen,
      managerAddress: body.managerAddress,
      reserveAddress: body.reserveAddress,
      freezeAddress: body.freezeAddress,
      clawbackAddress: body.clawbackAddress,
    };

    console.log(params);

    return await this.txnService.asset(
      body.from,
      body.unit,
      decimals,
      totalTokens,
      params
    );

    // const assetId = await this.txnService.asset('test', 'kavya', 0, 1, { assetName: 'test', url: 'http://test.com', defaultFrozen: false,
    //     managerAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M',
    //     reserveAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M',
    //     freezeAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M',
    //     clawbackAddress: 'C6A7MF2QX27SARKX32PUH2WWTUMFTH3UUBQ4DU4KBNXB4N2DTENO6HVF3M' })

    // return assetId
  }

  @Post("asset-transfer")
  async transferAsset(
    @Body() body: { assetId: number; from: string; to: string; amount: number }
  ): Promise<{ txnId: string; error: string }> {
    const assetId = Number(body.assetId);
    const amount = Number(body.amount);

    return await this.txnService.transferToken(
      assetId,
      body.from,
      body.to,
      amount
    );

    // return { txnId : await this.txnService.transferToken(734471494, 'test ', 'V5LR6C5SVHBQY3SPTEPD5WEGNBBUDNEP2MSDIONQIODZXZHRMC6QF3CTZI', 1)}
  }

  @Post("opt-in-asset")
  async optInAsset(
    @Body() body: { assetId: number; from: string }
  ): Promise<{ txnId: string }> {
    console.log("Body params -------", body);
    const assetId = Number(body.assetId);

    return await this.txnService.optInAsset(assetId, body.from);
    // return { txnId : await this.txnService.optInAsset(734469357, 'test1')}
  }

  @Post("create-application")
  async createApplication(
    @Body()
    body: {
      from: string;
      approvalProgram: string;
      clearProgram: string;
      globalSchema: { numByteSlice: number; numUint: number };
      localSchema: { numByteSlice: number; numUint: number };
    }
  ): Promise<{ txnId: string; applicationId: number; error: string }> {
    const globalSchema = body.globalSchema;
    const localSchema = body.localSchema;

    return await this.txnService.createApplication(
      body.from,
      body.approvalProgram,
      body.clearProgram,
      globalSchema,
      localSchema
    );
    //    return await this.txnService.createApplication('test',
    //     'CjEbQQA0gAQCvs4RNhoAjgEAA4EAQzEZFEQxGEQ2GgFXAgCIACBJFRZXBgJMUIAEFR98dUxQsIEBQzEZQP/UMRgURIEBQ4oBAYAHSGVsbG8sIIv/UIk=',
    //     'CoEBQw==',
    //     { numByteSlice: 0, numUint: 0 }, { numByteSlice: 0, numUint: 0 });
  }
}
