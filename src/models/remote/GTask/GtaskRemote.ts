import { Task } from '../../Task';
import { Remote } from '../Remote';
import { GTaskAuthorize } from './GTaskAuthorize';

export class GtaskRemote implements Remote {
  private authorize: GTaskAuthorize;

  get(id: string): Promise<Task> {
    throw new Error('Method not implemented.');
  }
  list(): Promise<Task[]> {
    throw new Error('Method not implemented.');
  }
  update(from: Task): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // async authorize(): Promise<OAuth2Client> {
  //   if (this.authData.token) {
  //     return google.auth.fromJSON(this.authData.token) as OAuth2Client
  //   }

  //   const client = await authenticate({
  //     scopes: ['https://www.googleapis.com/auth/tasks.readonly'],
  //     keyfilePath: 'credentials.json',
  //   })

  //   if (client.credentials && this.authData.credentials) {
  //     const key = this.authData.credentials.installed || this.authData.credentials.web
  //     this.authData.token = {
  //       type: 'authorized_user',
  //       client_id: key.client_id,
  //       client_secret: key.client_secret,
  //       refresh_token: client.credentials.refresh_token,
  //     }
  //     await this.saveAuthData(this.authData)
  //   }

  //   return client
  // }
}
