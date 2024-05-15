import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';

@Injectable()
export class MsUsersService {
  constructor(private httpService: HttpService) {}

  getAccessToken(token: string) {
    console.log("el token es "+token)
    return this.httpService
      .post(`${process.env.APP_MS_USERS_URL}/auth/verify-token`, token, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .pipe(
        map((response) => {
          return response.data.id;
        }),
      );
  }
}