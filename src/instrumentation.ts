import { registerOTel } from "@vercel/otel";

registerOTel({ serviceName: "smash-ranker" });
