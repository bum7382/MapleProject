// tests/setup.js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export async function setupTestDB() {
  let mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // teardown 함수 리턴 (afterAll에 쓸 수 있음)
  return async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  };
}
