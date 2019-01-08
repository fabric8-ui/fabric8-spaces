import { Injectable, Inject } from '@angular/core';
import {
  HttpHeaders,
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  throwError as observableThrowError,
  of
} from 'rxjs';
import {
  catchError,
  map
} from 'rxjs/operators';

import { Logger } from 'ngx-base';
import { User } from 'ngx-login-client';

import { WIT_API_URL } from '../api/wit-api';

@Injectable()
export class CollaboratorService {

  spacesUrl: string;

  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private nextLink: string;
  private totalCount: number = -1;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    @Inject(WIT_API_URL) apiUrl: string) {
    this.spacesUrl = apiUrl + 'spaces';
  }

  getInitialBySpaceId(spaceId: string, pageSize: number = 20): Observable<User[]> {
    let url = this.spacesUrl + '/' + spaceId + '/collaborators' + '?page[limit]=' + pageSize;
    return this.http.get<User[]>(url, { headers: this.headers })
      .pipe(
        map((response: any) => {

          let links = response.links;
          if (links.hasOwnProperty('next')) {
            this.nextLink = links.next;
          } else {
            this.nextLink = null;
          }
          if (response.meta && response.meta.hasOwnProperty('totalCount')) {
            this.totalCount = response.meta.totalCount;
          } else {
            this.totalCount = -1;
          }

          let collaborators: User[] = response.data as User[];
          return collaborators;
        }),
        catchError((error) => {
          return this.handleError(error);
        })
      );
  }

  getNextCollaborators(): Observable<User[]> {
    if (this.nextLink) {
      return this.http.get<User[]>(this.nextLink, { headers: this.headers })
        .pipe(
          map((response: any) => {
            let links = response.links;
            if (links.hasOwnProperty('next')) {
              this.nextLink = links.next;
            } else {
              this.nextLink = null;
            }

            let collaborators: User[] = response.data as User[];
            return collaborators;
          }),
          catchError((error) => {
            return this.handleError(error);
          })
        );
    } else {
      return observableThrowError('No more collaborators found');
    }
  }

  addCollaborators(spaceId: string, users: User[]): Observable<User[]> {
    let url = this.spacesUrl + '/' + spaceId + '/collaborators';
    let payload = JSON.stringify({ data: users });
    return this.http.post<User[]>(url, payload, { headers: this.headers })
      .pipe(
        catchError((error) => {
          return this.handleError(error);
        })
      );
  }

  removeCollaborator(spaceId: string, collaboratorId: string): Observable<{}> {
    let url = this.spacesUrl + '/' + spaceId + '/collaborators/' + collaboratorId;
    return this.http.delete(url, { headers: this.headers })
      .pipe(
        catchError((error) => {
          return this.handleError(error);
        })
      );
  }

  getTotalCount(): Observable<number> {
    return of(this.totalCount);
  }

  private handleError(error: any) {
    this.logger.error(error);
    return observableThrowError(error.message || error);
  }

}
