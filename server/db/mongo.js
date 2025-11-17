import mongoose from "mongoose";

let connectPromise = null;
let hasLogged = false;
let cachedDb = null;

function logConnection(uri) {
  if (!mongoose.connection) return;
  if (mongoose.connection.readyState !== 1) return;
  if (hasLogged) return;
  hasLogged = true;
  const name = mongoose.connection.name;
  const dbName = mongoose.connection.db?.databaseName;
  console.log("[DB]", name, dbName, uri);
}

export async function connectMongo(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }

  if (mongoose.connection.readyState === 1) {
    logConnection(uri);
    return mongoose.connection;
  }

  if (!connectPromise) {
    connectPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then((conn) => {
        logConnection(uri);
        return conn;
      })
      .catch((err) => {
        connectPromise = null;
        throw err;
      });
  }

  return connectPromise;
}

export async function ensureMongoConnection() {
  if (mongoose.connection.readyState === 1) {
    logConnection(process.env.MONGO_URI);
    return mongoose.connection;
  }
  return connectMongo();
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    hasLogged = false;
    connectPromise = null;
    cachedDb = null;
  }
}

export async function getDb() {
  const connection = await ensureMongoConnection();
  if (!cachedDb) {
    cachedDb = connection.db;
  }
  return cachedDb;
}

export { mongoose };
