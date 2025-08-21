export function getQueryParam(url: string, param: string): string | null {
    const urlObj = new URL(url); // Parse the URL
    return urlObj.searchParams.get(param); // Get the specific query parameter
}