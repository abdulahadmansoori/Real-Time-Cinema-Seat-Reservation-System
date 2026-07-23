import { buildPageMeta, type Paginated } from "@cinema/shared";

type PaginateArgs<T> = {
  page: number;
  pageSize: number;
  findMany: (args: { skip: number; take: number }) => Promise<T[]>;
  count: () => Promise<number>;
};

export async function paginate<T>({
  page,
  pageSize,
  findMany,
  count,
}: PaginateArgs<T>): Promise<Paginated<T>> {
  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    findMany({ skip, take: pageSize }),
    count(),
  ]);
  return {
    data,
    meta: buildPageMeta(page, pageSize, total),
  };
}
