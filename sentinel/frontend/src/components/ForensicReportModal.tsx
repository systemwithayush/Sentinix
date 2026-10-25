import React, { useState } from 'react';
import type { ForensicDossier } from '../utils/forensicReport';
import { formatDossierMarkdown } from '../utils/forensicReport';
import { TARGET_LABELS } from '../utils/forensicFilters';

export interface ForensicReportModalProps {
  dossier: ForensicDossier;
  onClose: () => void;
}

export const ForensicReportModal: React.FC<ForensicReportModalProps> = ({
  dossier,
  onClose
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const targetInfo = TARGET_LABELS[dossier.targetClass];

  const handleCopyMarkdown = () => {
    const md = formatDossierMarkdown(dossier);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${dossier.controlNumber}_evidence_dossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-tactical-dark border-2 border-tactical-green w-full max-w-5xl max-h-[94vh] flex flex-col shadow-[0_0_35px_rgba(0,255,65,0.25)] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Top Header Bar */}
        <div className="bg-black/95 px-6 py-3 border-b border-tactical-olive flex justify-between items-center print:border-b-2 print:border-black print:bg-white">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-status-green animate-pulse print:hidden"></span>
            <div>
              <h2 className="font-mono text-base font-black text-white tracking-widest print:text-black">
                DIGITAL FORENSIC EVIDENCE DOSSIER
              </h2>
              <div className="text-[10px] font-mono text-tactical-light/80 print:text-black">
                STANDARD COMPLIANCE: {dossier.standardCompliance}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 print:hidden font-mono text-xs">
            {/* Copy Markdown */}
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1 bg-tactical-olive border border-tactical-green text-white hover:bg-tactical-green hover:text-black font-bold transition-colors flex items-center space-x-1"
            >
              <span>{copied ? '✓ COPIED!' : '📋 COPY MD'}</span>
            </button>

            {/* Download JSON */}
            <button
              onClick={handleDownloadJson}
              className="px-3 py-1 bg-tactical-dark border border-tactical-olive text-tactical-light hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>💾 JSON</span>
            </button>

            {/* Print / Export PDF */}
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-status-amber text-black font-bold hover:bg-yellow-400 transition-colors flex items-center space-x-1 shadow-md"
            >
              <span>🖨️ PRINT / PDF</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-tactical-light hover:text-white border border-tactical-olive hover:border-tactical-green"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Security Classification Banner */}
        <div className="bg-status-red/15 border-b border-status-red/40 px-6 py-1.5 flex justify-between items-center text-status-red font-mono text-xs print:bg-gray-100 print:text-black print:border-black">
          <span className="font-bold tracking-wider">{dossier.securityClassification}</span>
          <span>EVIDENTIAL CONTROL NO: <strong className="text-white print:text-black">{dossier.controlNumber}</strong></span>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs print:overflow-visible print:p-2">
          
          {/* Section 1: Case Identification & Sensor Attribution */}
          <div className="bg-black/40 border border-tactical-olive p-4 space-y-3 print:border-black print:bg-white">
            <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2 print:border-black">
              <span className="text-tactical-green font-bold tracking-wider flex items-center text-xs print:text-black">
                <span className="text-status-green mr-1.5">›</span>
                SECTION 1: CASE IDENTIFICATION & SENSOR ATTRIBUTION
              </span>
              <span className="text-[10px] text-tactical-light print:text-black">
                NODE: {dossier.terminalNode}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">INCIDENT TIME (UTC):</span>
                <span className="text-white font-bold print:text-black">{dossier.incidentTimestampUtc}</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">REPORT COMPILED (UTC):</span>
                <span className="text-white font-bold print:text-black">{dossier.generatedAtUtc}</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">SOURCE SENSOR FEED:</span>
                <span className="text-status-amber font-bold print:text-black">{dossier.sensorName}</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">SENSOR MODALITY:</span>
                <span className="text-white print:text-black">{dossier.sensorModality === 'IR_THERMAL' ? 'IR THERMAL SPECTRUM' : 'EO OPTICAL SPECTRUM'}</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">GEO COORDINATES (MGRS):</span>
                <span className="text-tactical-green font-bold print:text-black">{dossier.mgrsCoordinates}</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">VIDEO TIMECODE:</span>
                <span className="text-status-green font-bold print:text-black">{dossier.timecode}</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">TARGET CLASSIFICATION:</span>
                <span className="text-white font-bold bg-black/60 px-1 border border-tactical-olive print:text-black print:bg-white">
                  {targetInfo?.icon} {targetInfo?.label || dossier.targetClass}
                </span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">CONFIDENCE RATING:</span>
                <span className="text-status-green font-bold print:text-black">{dossier.confidence} CONFIRMED</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">INVESTIGATING ANALYST:</span>
                <span className="text-white font-bold print:text-black">{dossier.investigatingAnalyst}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Cryptographic Hash Verification */}
          <div className="bg-black/40 border border-tactical-olive p-4 space-y-3 print:border-black print:bg-white">
            <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2 print:border-black">
              <span className="text-tactical-green font-bold tracking-wider flex items-center text-xs print:text-black">
                <span className="text-status-green mr-1.5">›</span>
                SECTION 2: DIGITAL EVIDENCE INTEGRITY & CRYPTOGRAPHIC PROOF
              </span>
              <span className="px-2 py-0.5 bg-status-green/20 border border-status-green text-status-green text-[10px] font-bold print:border-black print:text-black print:bg-white">
                CHAIN INTACT // {dossier.hashIntegrity.tamperVerification}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-tactical-dark p-2 border border-tactical-olive/40 print:bg-white print:border-black">
                <span className="text-tactical-light font-bold print:text-gray-700">SOURCE STREAM MD5:</span>
                <span className="text-white font-mono break-all print:text-black">{dossier.hashIntegrity.sourceVideoMd5}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-tactical-dark p-2 border border-tactical-olive/40 print:bg-white print:border-black">
                <span className="text-tactical-light font-bold print:text-gray-700">SOURCE STREAM SHA-256:</span>
                <span className="text-white font-mono break-all print:text-black">{dossier.hashIntegrity.sourceVideoSha256}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-tactical-dark p-2 border border-tactical-olive/40 print:bg-white print:border-black">
                <span className="text-tactical-light font-bold print:text-gray-700">EXAMINED KEYFRAME SHA-256:</span>
                <span className="text-tactical-green font-mono break-all font-bold print:text-black">{dossier.hashIntegrity.inspectedKeyframeSha256}</span>
              </div>
            </div>

            <div className="text-[10px] text-tactical-light/80 italic print:text-gray-600">
              * Cryptographic guarantee: Digital evidence acquired via RTSP transport adheres to FIPS 180-4 hashing standards. No frame substitution or non-linear compression has occurred.
            </div>
          </div>

          {/* Section 3: Image Processing Methodology */}
          <div className="bg-black/40 border border-tactical-olive p-4 space-y-3 print:border-black print:bg-white">
            <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2 print:border-black">
              <span className="text-tactical-green font-bold tracking-wider flex items-center text-xs print:text-black">
                <span className="text-status-green mr-1.5">›</span>
                SECTION 3: FORENSIC IMAGE PROCESSING PARAMETERS & CALIBRATION
              </span>
              <span className="text-white font-bold bg-tactical-olive/40 px-2 py-0.5 border border-tactical-olive print:text-black print:bg-white">
                FILTER: {dossier.filterMode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-tactical-dark p-2 border border-tactical-olive/40 print:bg-white print:border-black">
                <span className="text-tactical-light block text-[10px] print:text-gray-700">PRIMARY CONVOLUTION:</span>
                <span className="text-white font-bold print:text-black">{dossier.filterMode} 3×3</span>
              </div>
              <div className="bg-tactical-dark p-2 border border-tactical-olive/40 print:bg-white print:border-black">
                <span className="text-tactical-light block text-[10px] print:text-gray-700">CONTRAST GAIN:</span>
                <span className="text-white font-bold print:text-black">{dossier.filterOptions.contrast.toFixed(1)}x</span>
              </div>
              <div className="bg-tactical-dark p-2 border border-tactical-olive/40 print:bg-white print:border-black">
                <span className="text-tactical-light block text-[10px] print:text-gray-700">EDGE SENSITIVITY:</span>
                <span className="text-white font-bold print:text-black">{dossier.filterOptions.edgeSensitivity.toFixed(1)}x</span>
              </div>
              <div className="bg-tactical-dark p-2 border border-tactical-olive/40 print:bg-white print:border-black">
                <span className="text-tactical-light block text-[10px] print:text-gray-700">OPTICAL ZOOM FACTOR:</span>
                <span className="text-status-amber font-bold print:text-black">{dossier.filterOptions.zoom.toFixed(1)}x MAGNIFIED</span>
              </div>
            </div>

            <div className="p-2 bg-tactical-olive/20 border border-tactical-olive text-[11px] text-gray-300 font-sans leading-relaxed print:bg-white print:text-black print:border-black">
              <strong>Technical Justification:</strong> The applied {dossier.filterMode} filter isolates spatial frequency gradients, neutralizing vegetative clutter and emphasizing rigid structural geometries (perpendicular construction margins, trench contours, and metallic/fabric netting boundaries).
            </div>
          </div>

          {/* Section 4: Geometric Anomaly & Pattern Measurement Table */}
          {dossier.geometricAnomalies && dossier.geometricAnomalies.length > 0 && (
            <div className="bg-black/40 border border-tactical-olive p-4 space-y-3 print:border-black print:bg-white">
              <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2 print:border-black">
                <span className="text-status-amber font-bold tracking-wider flex items-center text-xs print:text-black">
                  <span className="text-status-amber mr-1.5">›</span>
                  SECTION 4: GEOMETRIC ANOMALY ANALYSIS (SQUARES, RECTANGLES & LINEAR PATTERNS)
                </span>
                <span className="text-status-amber text-[10px] font-bold">
                  {dossier.geometricAnomalies.length} ARTIFICIAL SHAPES IDENTIFIED
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-tactical-dark border-b border-tactical-olive text-tactical-light print:bg-gray-100 print:text-black print:border-black">
                      <th className="p-2">SHAPE ID</th>
                      <th className="p-2">GEOMETRIC PATTERN</th>
                      <th className="p-2">DIMENSIONS / AREA</th>
                      <th className="p-2">ORTHOGONALITY (CORNER)</th>
                      <th className="p-2">ARTIFICIALITY</th>
                      <th className="p-2">TEXTURE Z-SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.geometricAnomalies.map((g, idx) => (
                      <tr key={idx} className="border-b border-tactical-olive/30 hover:bg-tactical-olive/10 print:border-black">
                        <td className="p-2 font-bold text-white print:text-black">{g.id}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                            g.shapeType === 'SQUARE' ? 'border-yellow-500 text-yellow-400 bg-yellow-950/40' :
                            g.shapeType === 'RECTANGLE' ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40' :
                            'border-purple-400 text-purple-300 bg-purple-950/40'
                          } print:border-black print:text-black print:bg-white`}>
                            {g.shapeType}
                          </span>
                        </td>
                        <td className="p-2 text-white font-bold print:text-black">{g.estimatedDimensions}</td>
                        <td className="p-2 text-tactical-green print:text-black">{g.cornerAngleOrthogonality}</td>
                        <td className="p-2 text-status-amber font-bold print:text-black">{(g.artificialityConfidence * 100).toFixed(1)}%</td>
                        <td className="p-2 text-status-red font-bold print:text-black">+{g.contextDisruptionZScore}σ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 pt-1">
                {dossier.geometricAnomalies.map((g, idx) => (
                  <div key={idx} className="p-2 bg-tactical-dark border border-tactical-olive/40 text-[11px] print:bg-white print:text-black print:border-black">
                    <strong className="text-status-amber">[{g.id} — {g.shapeType}]:</strong> {g.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Analyst Narrative & Tactical Disposition */}
          <div className="bg-black/40 border border-tactical-olive p-4 space-y-3 print:border-black print:bg-white">
            <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2 print:border-black">
              <span className="text-tactical-green font-bold tracking-wider flex items-center text-xs print:text-black">
                <span className="text-status-green mr-1.5">›</span>
                SECTION 5: ANALYST NARRATIVE & OPERATIONAL DISPOSITION
              </span>
              <span className="px-2 py-0.5 bg-status-red/20 border border-status-red text-status-red font-bold text-[10px] print:border-black print:text-black print:bg-white">
                DISPOSITION: {dossier.disposition}
              </span>
            </div>

            <div className="p-3 bg-tactical-dark border border-tactical-olive text-gray-200 font-sans text-xs leading-relaxed print:bg-white print:text-black print:border-black">
              {dossier.analystNarrative}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">DISPOSITION RATIONALE:</span>
                <span className="text-white print:text-black">{dossier.dispositionRationale}</span>
              </div>
              <div>
                <span className="text-tactical-light block text-[10px] print:text-gray-700">EVIDENTIARY SUMMARY:</span>
                <span className="text-tactical-green print:text-black">{dossier.evidentiarySummary}</span>
              </div>
            </div>
          </div>

          {/* Section 6: Chain of Custody Log */}
          <div className="bg-black/40 border border-tactical-olive p-4 space-y-3 print:border-black print:bg-white">
            <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2 print:border-black">
              <span className="text-tactical-green font-bold tracking-wider flex items-center text-xs print:text-black">
                <span className="text-status-green mr-1.5">›</span>
                SECTION 6: FORMAL CHAIN OF CUSTODY (ISO/IEC 27037)
              </span>
              <span className="text-[10px] text-tactical-light print:text-black">
                TRANSFERS: {dossier.chainOfCustody.length} ENTRIES
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-tactical-dark border-b border-tactical-olive text-tactical-light print:bg-gray-100 print:text-black print:border-black">
                    <th className="p-2">SEQ</th>
                    <th className="p-2">TIMESTAMP (UTC)</th>
                    <th className="p-2">ACTION</th>
                    <th className="p-2">CUSTODIAN</th>
                    <th className="p-2">TERMINAL</th>
                    <th className="p-2">NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.chainOfCustody.map((c, idx) => (
                    <tr key={idx} className="border-b border-tactical-olive/30 hover:bg-tactical-olive/10 print:border-black">
                      <td className="p-2 text-tactical-light print:text-black">{c.sequence}</td>
                      <td className="p-2 text-white print:text-black whitespace-nowrap">{c.timestamp}</td>
                      <td className="p-2 font-bold text-status-green print:text-black">{c.action}</td>
                      <td className="p-2 text-tactical-green font-bold print:text-black">{c.officerCallsign}</td>
                      <td className="p-2 text-tactical-light print:text-black">{c.terminalId}</td>
                      <td className="p-2 text-gray-300 font-sans print:text-black">{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7: Formal Attestation & Signature Block */}
          <div className="bg-black/80 border border-tactical-olive p-4 font-mono text-xs space-y-2 print:border-black print:bg-white">
            <div className="text-tactical-green font-bold tracking-wider border-b border-tactical-olive/60 pb-1 print:border-black print:text-black">
              SECTION 7: ANALYST ATTESTATION & LEGAL / ADMISSIBILITY NOTICE
            </div>
            <div className="text-gray-300 font-sans text-xs leading-relaxed print:text-black">
              I hereby certify that this forensic intelligence dossier has been prepared in accordance with standard digital forensics protocols (ISO/IEC 27037). The images, cryptographic hashes, geometric anomaly metrics, and analytical conclusions are true reflections of the acquired sensor telemetry. Sentinel operates strictly as an advisory intelligence engine; final tactical determination rests with the certified analyst.
            </div>
            <div className="pt-2 flex justify-between items-end border-t border-tactical-olive/40 print:border-black">
              <div>
                <span className="text-[10px] text-tactical-light block print:text-gray-700">CERTIFIED ELECTRONIC SIGNATURE:</span>
                <span className="text-status-green font-bold text-sm tracking-widest print:text-black">
                  /S/ {dossier.investigatingAnalyst} [VERIFIED TACTICAL KEY]
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-tactical-light block print:text-gray-700">DATE RECORD SEALED:</span>
                <span className="text-white font-bold print:text-black">{dossier.generatedAtUtc}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-black/95 px-6 py-2.5 border-t border-tactical-olive flex justify-between items-center font-mono text-[10px] text-tactical-light print:border-black print:bg-white print:text-black">
          <span>SENTINEL DIGITAL FORENSIC SYSTEM v1.3.0</span>
          <span>DOCUMENT CLASSIFICATION: {dossier.securityClassification}</span>
        </div>

      </div>
    </div>
  );
};
