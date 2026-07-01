import "dotenv/config";

const url = new URL(process.env.REDIS_URL!);

const connection = {
  host: url.hostname,
  port: Number(url.port),
  password: url.password,
};

export default connection;
