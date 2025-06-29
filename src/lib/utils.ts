/**
 * Utility functions for VLab
 */

/**
 * Wraps a promise with a timeout mechanism
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout duration in milliseconds
 * @param timeoutMessage - Custom timeout error message
 * @returns Promise that rejects if timeout is reached
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Logs performance timing for operations
 * @param label - Label for the operation
 * @param operation - Function that returns a promise
 * @returns Promise with the operation result
 */
export async function withTiming<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  console.log(`🕐 [${label}] Starting operation`);
  
  try {
    const result = await operation();
    const endTime = performance.now();
    console.log(`✅ [${label}] Completed in ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(`❌ [${label}] Failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Debounce function to limit how often a function can be called
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}