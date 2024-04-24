import { IsEmail } from 'class-validator'

export class updateUserDto {
	@IsEmail()
	email: string

	password?: string

	isAdmin?: boolean
}
