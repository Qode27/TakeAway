process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/order_hub_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_ACCESS_SECRET = "test-access-secret-12345678901234567890";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890123456789";
