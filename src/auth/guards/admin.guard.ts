import { CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserModel } from 'src/user/user.model'

export class OnlyAdminGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<{ user: UserModel }>()

		const user = request.user

		if (!user.isAdmin) {
			throw new Error('Only admin can do this')
		}

		return user.isAdmin
	}
}
