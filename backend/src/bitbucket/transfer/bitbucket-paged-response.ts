export default class PagedResponse<ValueType> {
  next?: string;

  page?: number;

  values?: ValueType[];
}
