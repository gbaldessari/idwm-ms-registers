import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {MsUsersService} from "../../../conection/ms-users.service";
import {Connection} from "typeorm";
import {Observable} from "rxjs";

@Injectable()
export class IsAdminGuard implements CanActivate {
    constructor(
        private readonly msUsersService: MsUsersService,
        private readonly connection: Connection,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization.split(' ')[1];

        const { isAdmin } = await this.msUsersService
            .getAccessToken(token)
            .toPromise();
        if (!isAdmin) {
            throw new ForbiddenException('Only admins can access');
        }
        return true;
    }
}