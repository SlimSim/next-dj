export const isMobile = (): boolean => {
    if (typeof navigator !== "undefined") {
        if ('userAgentData' in navigator && navigator.userAgentData ) {
			return (navigator.userAgentData as { mobile: boolean }).mobile;
        }

		// Fallback to user agent string matching (consider adding more patterns if needed)
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    return false; // If navigator is not defined, assume non-mobile
};