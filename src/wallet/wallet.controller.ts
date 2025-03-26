import { Controller, Logger, Post, Body } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { EncoderFactory } from "../chain/encoder.factory";
import { Crafter } from "../chain/crafter.role";
import { ConfigService } from "@nestjs/config";
import { CrafterFactory } from "../chain/crafter.factory";
import { ApiBody, ApiTags } from "@nestjs/swagger";

@ApiTags("Wallet")
@Controller("wallet")
export class Wallet {
  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService
  ) {}

  /**
   *
   * @param token
   * @returns
   */
  async login(token: string): Promise<boolean> {
    return this.walletService.auth(token);
  }

  /**
   *
   * @returns
   */
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
        },
      },
    },
  })
  @Post("address")
  async getAddress(
    @Body() body: { key: string },
    encoding: "algorand" = "algorand",
    index: number = 0
  ): Promise<{ address: string }> {
    console.log("body --------------- ", body);
    console.log("encoding --------------- ", encodeURI(body.key));
    const publicKey: Buffer = await this.walletService.getPublicKey(body.key);
    console.log("public key buffer --------------- ", publicKey);
    const encodedPublicKey =
      EncoderFactory.getEncoder(encoding).encodeAddress(publicKey);
    console.log("encoded public key --------------- ", encodedPublicKey);
    return {
      address: encodedPublicKey,
    };
  }

  /**
   *
   */
  async sign(data: Uint8Array): Promise<Uint8Array> {
    //TODO: prompt new auth method

    const string: string = (
      await this.walletService.rawSign(Buffer.from(data), "test")
    ).toString();

    // split vault specific prefixes vault:${version}:signature
    const signature = string.split(":")[2];

    // vault default base64 decode
    const decoded: Buffer = Buffer.from(signature, "base64");

    // return as Uint8Array
    return new Uint8Array(decoded);
  }

  /**
   *
   * @param txn
   * @returns
   */
  async submitTransaction(txn: Uint8Array): Promise<string> {
    return this.walletService.submitTransaction(txn);
  }

  /**
   *
   * @param chain
   */
  craft(chain: "algorand" | "other" = "algorand"): Crafter {
    return CrafterFactory.getCrafter(chain, this.configService);
  }

  /**
   *
   * @param chain
   * @returns
   */
  encoder(chain: "algorand" | "other" = "algorand") {
    return EncoderFactory.getEncoder(chain);
  }
}
