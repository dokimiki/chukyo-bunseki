import { ChkyuoAutomationWorker, ActionResult } from "./automation.js";

/**
 * Chukyo University portal specific automation worker
 */
export class ChkyuoPortalWorker extends ChkyuoAutomationWorker {
    /**
     * Navigate to student portal top page
     */
    async goToPortalTop(): Promise<ActionResult> {
        return await this.navigateTo("https://manabo.cnc.chukyo-u.ac.jp");
    }
}

/**
 * Convenience function to create and initialize portal worker
 */
export async function createPortalWorker(options = {}): Promise<ChkyuoPortalWorker> {
    const worker = new ChkyuoPortalWorker(options);
    await worker.initialize();
    return worker;
}
