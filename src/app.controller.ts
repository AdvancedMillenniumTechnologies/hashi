// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet/wallet.service';
import { EncoderFactory } from "./chain/encoder.factory"

@Controller()
export class AppController {
  constructor(private readonly walletService: WalletService) {}

   
}