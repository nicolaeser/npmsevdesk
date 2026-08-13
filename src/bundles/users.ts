import type { SevdeskClient } from "../client/sevdesk-client.js";
import { mapUserListResult, mapUserResult } from "../domain/result-mappers.js";
import type { UserListResult, UserResult } from "../domain/results.js";
import type { SevdeskIdInput } from "../types/references.js";
import { validatePaginationLimit, validatePaginationOffset } from "../utils/validation.js";
import { asRequest, numericId } from "./internal.js";
import type { CuratedRequestOptions } from "./types.js";

export interface UserListOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly countAll?: boolean;
}

export class UsersBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: UserListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<UserListResult> {
    const limit =
      options.limit === undefined
        ? undefined
        : validatePaginationLimit(options.limit, "users list");
    const offset =
      options.offset === undefined
        ? undefined
        : validatePaginationOffset(options.offset, "users list");
    const result = await this.client.raw.sevUser.getSevUsers(
      asRequest<"getSevUsers">(
        {
          query: {
            ...(limit === undefined ? {} : { limit }),
            ...(offset === undefined ? {} : { offset }),
            ...(options.countAll === undefined ? {} : { countAll: options.countAll })
          }
        },
        requestOptions
      )
    );
    return mapUserListResult(result);
  }
  public async get(
    userId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<UserResult> {
    const result = await this.client.raw.sevUser.getSevUserById(
      asRequest<"getSevUserById">(
        { path: { sevUserId: numericId(userId, "sevUser") } },
        requestOptions
      )
    );
    return mapUserResult(result);
  }
}