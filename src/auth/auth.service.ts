import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { compare, genSalt, hash } from 'bcryptjs'
import { InjectModel } from 'nestjs-typegoose'
import { UserModel } from 'src/user/user.model'
import { AuthDto } from './dto/auth.dto'
import { RefreshTokenDto } from './dto/refreshToken.dto'

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>,
		private readonly jwtService: JwtService
	) {}

	async register(dto: AuthDto) {
		const oldUser = await this.UserModel.findOne({
			email: dto.email,
		})

		if (oldUser) {
			throw new BadRequestException('User with this email already exists')
		}

		const newUser = new this.UserModel({
			email: dto.email,
			password: await hash(dto.password, await genSalt(10)),
		})

		const user = await newUser.save()

		const tokens = await this.issueTokenPair(String(newUser._id))

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	async getNewTokens({ refreshToken }: RefreshTokenDto) {
		if (!refreshToken) {
			throw new BadRequestException('Please sign in')
		}

		const result = await this.jwtService.verifyAsync(refreshToken)

		if (!result) {
			throw new UnauthorizedException('Invalid token or expired!')
		}

		const user = await this.UserModel.findById(result._id)

		const tokens = await this.issueTokenPair(String(user._id))

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	async login(dto: AuthDto) {
		const user = await this.validateUser(dto)

		const tokens = await this.issueTokenPair(String(user._id))

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	async validateUser(dto: AuthDto): Promise<UserModel> {
		const user = await this.UserModel.findOne({
			email: dto.email,
		})

		if (!user) {
			throw new UnauthorizedException('User not found')
		}

		const isValidPassword = await compare(dto.password, user.password)

		if (!isValidPassword) {
			throw new UnauthorizedException('Invalid password')
		}

		return user
	}

	async issueTokenPair(userId: string) {
		const data = { _id: userId }

		const refreshToken = await this.jwtService.signAsync(data, {
			expiresIn: '15d',
		})

		const accessToken = await this.jwtService.signAsync(data, {
			expiresIn: '15min',
		})
		return { refreshToken, accessToken }
	}

	returnUserFields(user: UserModel) {
		return {
			_id: user._id,
			email: user.email,
			isAdmin: user.isAdmin,
		}
	}
}
