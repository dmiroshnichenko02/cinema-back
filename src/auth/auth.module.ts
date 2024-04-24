import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypegooseModule } from 'nestjs-typegoose'
import { getJWTConfig } from 'src/config/jwt.config'
import { UserModel } from 'src/user/user.model'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JWTStrategy } from './strategies/jwt.strategy'

@Module({
	controllers: [AuthController],
	imports: [
		TypegooseModule.forFeature([
			{
				schemaOptions: {
					collection: 'User',
				},
				typegooseClass: UserModel,
			},
		]),
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJWTConfig,
		}),
	],
	providers: [AuthService, JWTStrategy],
})
export class AuthModule {}
