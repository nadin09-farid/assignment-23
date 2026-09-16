import type {
  CreateOptions,
  HydratedDocument,
  Model,
  MongooseUpdateQueryOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';

abstract class DBRepo<T> {
  constructor(private Model: Model<T>) {}

  public async create({
    data,
    options,
  }: {
    data: any;
    options?: CreateOptions;
  }) {
    return await this.Model.create(data, options);
  }

  public async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T>;
  }) {
    return await this.Model.findOne(filter, projection, options);
  }

  public async find({
    filter,
    projection,
    options,
    populate,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T>;
    populate?: string | string[];
  }) {
    const query = this.Model.find(filter, projection, options);
    if (populate) query.populate(populate);
    return await query;
  }

  public async countDocuments(filter?: QueryFilter<T>) {
    return await this.Model.countDocuments(filter);
  }

  public async findById({
    id,
    projection,
    options,
    populate,
  }: {
    id: string | Types.ObjectId;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T>;
    populate?: string | string[];
  }) {
    const query = this.Model.findById(id, projection, options);
    if (populate) query.populate(populate);
    return await query;
  }

  public async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<T>;
    update: UpdateQuery<T>;
    options?: MongooseUpdateQueryOptions;
  }) {
    return await this.Model.updateOne(filter, update, options);
  }

  getDBDoc(data: T) {
    return new this.Model(data);
  }
  async saveDBDoc(doc: HydratedDocument<T>) {
    return await doc.save();
  }
}
export default DBRepo;
