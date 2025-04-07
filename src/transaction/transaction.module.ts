import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"
import { Transaction } from "./transaction.controller"
import { WalletService } from "../wallet/wallet.service"
import { VaultModule } from "src/vault/vault.module"
import { VaultService } from "src/vault/vault.service"
import { ChainModule } from "src/chain/chain.module"
import { ConfigModule } from "@nestjs/config"
import { TransactionService } from "./transaction.service"
import { AlgorandTransactionCrafter } from '@algorandfoundation/algo-models'
// import { AlgoTxCrafter, CrafterFactory } from "src/chain/crafter.factory"

@Module({
    imports: [HttpModule, VaultModule, ChainModule, ConfigModule.forRoot()],
    controllers: [Transaction],
    providers: [WalletService, VaultService, TransactionService, AlgorandTransactionCrafter, String, Object],
})

export class TransactionModule {}