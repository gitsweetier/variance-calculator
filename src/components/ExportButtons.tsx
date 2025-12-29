'use client';

import { Button } from './ui/Button';
import { SimulationPath, ConfidencePoint } from '@/lib/types';
import { generateSamplePathsCSV, generateDetailedRunCSV, downloadFile } from '@/lib/utils';

interface ExportButtonsProps {
  samplePaths: SimulationPath[];
  confidenceData: ConfidencePoint[];
  detailedPath: SimulationPath | null;
}

export function ExportButtons({
  samplePaths,
  confidenceData,
  detailedPath,
}: ExportButtonsProps) {
  const handleExportSamplePaths = () => {
    if (samplePaths.length === 0) return;
    const csv = generateSamplePathsCSV(samplePaths, confidenceData);
    downloadFile(csv, 'variance-sample-paths.csv');
  };

  const handleExportDetailedRun = () => {
    if (!detailedPath) return;
    const csv = generateDetailedRunCSV(detailedPath);
    downloadFile(csv, 'variance-detailed-run.csv');
  };

  const hasData = samplePaths.length > 0;

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportSamplePaths}
        disabled={!hasData}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download Sample Paths CSV
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportDetailedRun}
        disabled={!detailedPath}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download Detailed Run CSV
      </Button>
    </div>
  );
}
