export interface DockerService {
  id: string;
  name: string;
  image: string;
  ports: { host: string; container: string }[];
  volumes: { host: string; container: string }[];
  environment: { key: string; value: string }[];
  restart: "always" | "unless-stopped" | "no" | "on-failure";
}
