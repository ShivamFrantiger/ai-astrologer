import { MongoClient, Db } from 'mongodb';

const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URL || process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error(
      'Neither MONGODB_URL nor MONGODB_URI is configured in environment variables.'
    );
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getMongoDb(dbName = 'jyotix-astro'): Promise<Db> {
  const clientInstance = await getMongoClientPromise();
  return clientInstance.db(dbName);
}
