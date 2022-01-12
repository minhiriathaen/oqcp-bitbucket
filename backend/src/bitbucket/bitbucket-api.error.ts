/*
   eslint-disable
   @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
 */
export default class BitbucketApiError extends Error {
  constructor(private statusCode: number, private body: any) {
    super();
  }
}
