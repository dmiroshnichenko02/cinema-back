import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypegooseModule } from 'nestjs-typegoose'
import { UserModel } from 'src/user/user.model'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

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
	],
	providers: [AuthService],
})
export class AuthModule {}
