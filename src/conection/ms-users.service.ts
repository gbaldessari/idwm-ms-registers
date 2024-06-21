import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import {Observable} from "rxjs";

@Injectable()
export class MsUsersService {
  constructor(private httpService: HttpService) {}

  getAccessToken(token: string) {
    return this.httpService
      .post(
        `${process.env.APP_MS_USERS_URL}/auth/verify-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .pipe(
        map((response) => {
          return response.data;
        }),
      );
  }

}
