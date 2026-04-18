import { Document, Model, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { IRepository } from './repository.interface';

export abstract class BaseRepository<T extends Document> implements IRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  async findAll(filter: FilterQuery<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    return this.model.find(filter, null, options).exec();
  }

  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    return this.model.findById(id, null, options).exec();
  }

  async findOne(filter: FilterQuery<T>, options: QueryOptions = {}): Promise<T | null> {
    return this.model.findOne(filter, null, options).exec();
  }

  async create(entity: Partial<T>): Promise<T> {
    return this.model.create(entity);
  }

  async update(id: string, update: UpdateQuery<T>, options: QueryOptions = { new: true }): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(filter).exec();
    return result !== null;
  }
}
