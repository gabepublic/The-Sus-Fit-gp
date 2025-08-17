/**
 * Performance Monitoring Utilities for CI/CD Integration
 * 
 * This module provides utilities for:
 * - Establishing performance baselines
 * - Detecting performance regressions
 * - Generating performance reports
 * - Integrating with CI/CD pipelines
 */

export interface PerformanceBaseline {
  metric: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  threshold: number;
  description: string;
  createdAt: string;
  environment: {
    nodeVersion: string;
    platform: string;
    ciProvider?: string;
  };
}

export interface PerformanceResult {
  metric: string;
  value: number;
  baseline: number;
  threshold: number;
  passed: boolean;
  regression: boolean;
  regressionPercentage?: number;
  timestamp: string;
}

export interface PerformanceReport {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    regressions: number;
    overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  };
  results: PerformanceResult[];
  recommendations: string[];
  generatedAt: string;
}

/**
 * Default performance baselines for the three-layer architecture
 */
export const DEFAULT_BASELINES: PerformanceBaseline[] = [
  {
    metric: 'hook_initialization_bridge_layer',
    value: 50,
    unit: 'ms',
    threshold: 75,
    description: 'useBridgeLayer hook initialization time',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
  {
    metric: 'hook_initialization_workflow',
    value: 30,
    unit: 'ms',
    threshold: 45,
    description: 'useTryonWorkflow hook initialization time',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
  {
    metric: 'hook_initialization_backward_compat',
    value: 40,
    unit: 'ms',
    threshold: 60,
    description: 'usePageComponentState hook initialization time',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
  {
    metric: 'file_upload_processing',
    value: 200,
    unit: 'ms',
    threshold: 300,
    description: 'File upload and processing time',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
  {
    metric: 'api_call_duration',
    value: 1000,
    unit: 'ms',
    threshold: 1500,
    description: 'Mock API call duration including processing',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
  {
    metric: 'state_update_duration',
    value: 10,
    unit: 'ms',
    threshold: 20,
    description: 'Individual state update processing time',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
  {
    metric: 'memory_usage_per_hook',
    value: 5 * 1024 * 1024, // 5MB
    unit: 'bytes',
    threshold: 10 * 1024 * 1024, // 10MB
    description: 'Memory usage per hook instance',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
  {
    metric: 'complete_workflow_duration',
    value: 2000,
    unit: 'ms',
    threshold: 3000,
    description: 'Complete user workflow from upload to result',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ciProvider: process.env.CI ? 'unknown' : undefined,
    },
  },
];

export class PerformanceMonitor {
  private baselines: Map<string, PerformanceBaseline>;
  private results: PerformanceResult[] = [];

  constructor(customBaselines?: PerformanceBaseline[]) {
    this.baselines = new Map();
    
    // Load default baselines
    DEFAULT_BASELINES.forEach(baseline => {
      this.baselines.set(baseline.metric, baseline);
    });

    // Override with custom baselines if provided
    if (customBaselines) {
      customBaselines.forEach(baseline => {
        this.baselines.set(baseline.metric, baseline);
      });
    }
  }

  /**
   * Add a custom baseline
   */
  addBaseline(baseline: PerformanceBaseline): void {
    this.baselines.set(baseline.metric, baseline);
  }

  /**
   * Record a performance measurement
   */
  recordMeasurement(metric: string, value: number): PerformanceResult {
    const baseline = this.baselines.get(metric);
    
    if (!baseline) {
      throw new Error(`No baseline found for metric: ${metric}`);
    }

    const passed = value <= baseline.threshold;
    const regression = value > baseline.value * 1.1; // 10% regression threshold
    const regressionPercentage = regression ? 
      ((value / baseline.value - 1) * 100) : undefined;

    const result: PerformanceResult = {
      metric,
      value,
      baseline: baseline.value,
      threshold: baseline.threshold,
      passed,
      regression,
      regressionPercentage,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);
    return result;
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = totalTests - passed;
    const regressions = this.results.filter(r => r.regression).length;

    let overallStatus: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
    if (failed > 0) {
      overallStatus = 'FAIL';
    } else if (regressions > 0) {
      overallStatus = 'WARNING';
    }

    const recommendations: string[] = [];

    // Generate recommendations based on results
    if (regressions > 0) {
      recommendations.push(`${regressions} performance regression(s) detected. Review recent changes.`);
    }

    if (failed > 0) {
      const failedMetrics = this.results.filter(r => !r.passed).map(r => r.metric);
      recommendations.push(`Failed metrics: ${failedMetrics.join(', ')}. Consider optimizing these areas.`);
    }

    if (overallStatus === 'PASS' && regressions === 0) {
      recommendations.push('All performance metrics are within acceptable ranges.');
    }

    // Check for slow trends
    const slowMetrics = this.results.filter(r => 
      r.value > r.baseline * 1.05 && r.passed // 5% slower than baseline but still passing
    );
    
    if (slowMetrics.length > 0) {
      recommendations.push(`Trending slower: ${slowMetrics.map(m => m.metric).join(', ')}. Monitor for potential issues.`);
    }

    return {
      summary: {
        totalTests,
        passed,
        failed,
        regressions,
        overallStatus,
      },
      results: this.results,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Print performance report to console
   */
  printReport(): void {
    const report = this.generateReport();
    
    console.log('\n📊 PERFORMANCE MONITORING REPORT');
    console.log('='.repeat(50));
    console.log(`Status: ${this.getStatusEmoji(report.summary.overallStatus)} ${report.summary.overallStatus}`);
    console.log(`Tests: ${report.summary.passed}/${report.summary.totalTests} passed`);
    
    if (report.summary.regressions > 0) {
      console.log(`⚠️  Regressions: ${report.summary.regressions}`);
    }
    
    console.log('');
    
    // Print detailed results
    console.log('📈 Detailed Results:');
    report.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const regression = result.regression ? '⚠️' : '';
      const regressionText = result.regression ? 
        ` (${result.regressionPercentage?.toFixed(1)}% slower)` : '';
      
      console.log(`  ${status} ${regression} ${result.metric}: ${result.value}${this.getUnitSuffix(result.metric)} (baseline: ${result.baseline}${this.getUnitSuffix(result.metric)})${regressionText}`);
    });
    
    console.log('');
    
    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach(recommendation => {
        console.log(`  • ${recommendation}`);
      });
      console.log('');
    }
    
    console.log(`Generated at: ${report.generatedAt}`);
  }

  /**
   * Export results for CI/CD integration
   */
  exportForCI(): {
    exitCode: number;
    jsonReport: PerformanceReport;
    summary: string;
  } {
    const report = this.generateReport();
    const exitCode = report.summary.overallStatus === 'FAIL' ? 1 : 0;
    
    const summary = `Performance: ${report.summary.overallStatus} | ` +
      `${report.summary.passed}/${report.summary.totalTests} passed | ` +
      `${report.summary.regressions} regressions`;

    return {
      exitCode,
      jsonReport: report,
      summary,
    };
  }

  /**
   * Save baselines to file (for CI/CD persistence)
   */
  saveBaselines(): string {
    const baselinesArray = Array.from(this.baselines.values());
    return JSON.stringify(baselinesArray, null, 2);
  }

  /**
   * Load baselines from JSON string
   */
  loadBaselines(json: string): void {
    const baselines: PerformanceBaseline[] = JSON.parse(json);
    baselines.forEach(baseline => {
      this.baselines.set(baseline.metric, baseline);
    });
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'PASS': return '✅';
      case 'WARNING': return '⚠️';
      case 'FAIL': return '❌';
      default: return '❓';
    }
  }

  private getUnitSuffix(metric: string): string {
    const baseline = this.baselines.get(metric);
    if (!baseline) return '';
    
    switch (baseline.unit) {
      case 'ms': return 'ms';
      case 'bytes': return 'B';
      case 'count': return '';
      default: return '';
    }
  }

  /**
   * Reset all recorded results
   */
  reset(): void {
    this.results = [];
  }

  /**
   * Get current baselines
   */
  getBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Get current results
   */
  getResults(): PerformanceResult[] {
    return [...this.results];
  }
}

/**
 * Utility function to format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Create a performance monitor instance for tests
 */
export function createPerformanceMonitor(customBaselines?: PerformanceBaseline[]): PerformanceMonitor {
  return new PerformanceMonitor(customBaselines);
}

/**
 * Example usage in CI/CD:
 * 
 * ```typescript
 * import { createPerformanceMonitor } from './performance-monitor';
 * 
 * const monitor = createPerformanceMonitor();
 * 
 * // Record measurements during tests
 * monitor.recordMeasurement('hook_initialization_bridge_layer', 45);
 * monitor.recordMeasurement('file_upload_processing', 180);
 * 
 * // Generate and print report
 * monitor.printReport();
 * 
 * // Export for CI/CD
 * const { exitCode, summary } = monitor.exportForCI();
 * console.log(summary);
 * process.exit(exitCode);
 * ```
 */