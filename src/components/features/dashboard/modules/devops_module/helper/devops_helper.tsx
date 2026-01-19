import { DockerService } from "../types/devops_type";

export const explainCron = (cron: string) => {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5)
    return { text: "Invalid format (requires 5 parts)", error: true };

  const [min, hour, dom, mon, dow] = parts;
  let text = "";

  if (cron === "* * * * *") text = "Runs every minute";
  else if (min.startsWith("*/"))
    text = `Runs every ${min.replace("*/", "")} minutes`;
  else if (
    min === "0" &&
    hour !== "*" &&
    dom === "*" &&
    mon === "*" &&
    dow === "*"
  )
    text = `Runs at minute 0 past hour ${hour}`;
  else if (
    min === "0" &&
    hour === "0" &&
    dom === "*" &&
    mon === "*" &&
    dow === "*"
  )
    text = "Runs at 00:00 every day";
  else
    text = `At ${hour}:${min}, on day ${dom} of month ${mon}, and day of week ${dow}`;

  return { text, error: false };
};

// --- YAML GENERATOR ---
export const generateYamlBlock = (svc: DockerService) => {
  let block = `  ${svc.name}:\n`;
  block += `    image: ${svc.image}\n`;
  block += `    restart: ${svc.restart}\n`;

  if (svc.ports.length > 0) {
    block += `    ports:\n`;
    svc.ports.forEach((p) => (block += `      - "${p.host}:${p.container}"\n`));
  }
  if (svc.volumes.length > 0) {
    block += `    volumes:\n`;
    svc.volumes.forEach((v) => (block += `      - ${v.host}:${v.container}\n`));
  }
  if (svc.environment.length > 0) {
    block += `    environment:\n`;
    svc.environment.forEach((e) => (block += `      - ${e.key}=${e.value}\n`));
  }
  return block;
};
