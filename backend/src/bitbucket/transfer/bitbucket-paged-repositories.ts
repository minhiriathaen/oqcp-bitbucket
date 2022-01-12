/* eslint-disable max-classes-per-file */

class RepositoryResultPage<T> {
  next?: string;

  values!: T[];
}

class RepositoryData<T> {
  uuid?: string;

  links!: T;

  name?: string;

  slug?: string;
}

class RepositoryClones<T> {
  clone!: T[];
}

class RepositoryHref {
  href!: string;
}

export type BitbucketPagedRepositories = RepositoryResultPage<
  RepositoryData<RepositoryClones<RepositoryHref>>
>;
