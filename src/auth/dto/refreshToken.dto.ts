import { IsString } from 'class-validator'

export class RefreshTokenDto {
	@IsString({
		message: 'Invalid refresh token',
	})
	refreshToken: string
}
