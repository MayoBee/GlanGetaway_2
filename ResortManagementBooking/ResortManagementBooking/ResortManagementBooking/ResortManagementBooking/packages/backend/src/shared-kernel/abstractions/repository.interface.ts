import { Document, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export interface IRepository<T extends Document> {
  findAll(filter?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
  findById(id: string, options?: QueryOptions): Promise<T | null>;
  findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: FilterQuery<T>): Promise<number>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
}
