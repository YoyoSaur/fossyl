// Expected error: "Repository files (*.repo) must not import service files (*.service)..."
import { cacheChannelName } from "./analytics.service";
export const discord = () => cacheChannelName();
