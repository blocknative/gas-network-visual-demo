import { execSync } from 'child_process';

try {
	// Force resolutions for problematic packages
	execSync('npx yarn-deduplicate');
} catch (error) {
	console.warn('Warning: yarn-deduplicate failed, but continuing build...', error);
} 