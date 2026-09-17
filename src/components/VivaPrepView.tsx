import React, { useState } from 'react';
import { 
  GraduationCap, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export const VivaPrepView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: "1. What is File Integrity Monitoring (FIM) and why is it critical in Cyber Forensics?",
      a: "File Integrity Monitoring (FIM) is an internal control mechanism that verifies the integrity of operating system, application, and configuration files. In cyber forensics and incident response, FIM acts as an early warning system against unauthorized tampering, privilege escalation backdoors, and malware persistence mechanisms. Compliance frameworks like PCI-DSS 11.5 and NIST SP 800-53 specifically mandate FIM."
    },
    {
      q: "2. Why do we use cryptographic SHA-256 hashing instead of MD5 or CRC32?",
      a: "MD5 and CRC32 are cryptographically broken and vulnerable to collision attacks (where an attacker crafts two different files with the exact same hash). SHA-256 (part of the SHA-2 family defined by NIST) produces a 256-bit (64 hexadecimal characters) digest with zero known practical collisions. It guarantees pre-image resistance and collision resistance."
    },
    {
      q: "3. What is the 'Avalanche Effect' in cryptographic hashing?",
      a: "The Avalanche Effect is a fundamental property of secure cryptographic hash functions where altering even a single bit (such as changing a single space, uppercase letter, or digit) causes a dramatic, unpredictable change in approximately 50% of the resulting digest bits. This makes any unauthorized byte modification immediately detectable."
    },
    {
      q: "4. Why does an integrity violation NOT automatically equal malware detection?",
      a: "An integrity violation simply proves mathematical divergence between baseline and current state. Legitimate operational activities—such as scheduled operating system patches, authorized administrative config changes, or user edits—also alter file hashes. In digital forensic triage, hash mismatches trigger verification of change authorization rather than immediate automated malware declaration."
    },
    {
      q: "5. How does this system detect new unapproved executable files?",
      a: "The Threat Detection Engine inspects file extensions and directory entries during recursive folder enumeration. If an unknown file with an executable signature (.exe, .sh, .py, .bat, .bin, .elf) is discovered in monitored scopes without a pre-existing baseline, Rule 4 triggers a HIGH-severity alert for triage and sandbox analysis."
    },
    {
      q: "6. What is the significance of the mass-tampering heuristic (CRITICAL alert)?",
      a: "Ransomware and automated destructive wiping scripts modify large numbers of files in rapid succession. When the FIM engine detects 3 or more modified files during a single scanning cycle, Rule 1 escalates the incident to CRITICAL, alerting defenders to possible automated batch encryption or mass tampering."
    },
    {
      q: "7. Why is SQLite well-suited for this educational FIM project?",
      a: "SQLite is a serverless, zero-configuration, ACID-compliant relational database engine stored in a single file (security.db). It allows forensic students to easily inspect tables, preserve audit trails, write SQL queries, and archive evidence without the operational overhead of a database server daemon."
    },
    {
      q: "8. What are the main limitations of baseline-based FIM systems?",
      a: "Primary limitations include: (a) If an attacker compromises the system BEFORE the baseline is generated, the malicious state becomes the accepted baseline; (b) Storage overhead if full snapshots were kept; (c) Alert fatigue if active files (like rolling logs) are monitored without filtering."
    },
    {
      q: "9. How would you enhance this project for an enterprise production deployment?",
      a: "Production enhancements include: real-time inotify/eBPF kernel event hooks for zero-latency detection, digital signature verification with PKI certificates, integration with SIEM platforms (Splunk/Elastic) via Syslog/CEF, and hardware TPM storage for baseline hashes to prevent database tampering."
    }
  ];

  return (
    <div id="viva-prep-view" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          College Project Documentation & Viva Assessment Guide
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            B.Sc Cyber Forensic Science
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete project synopsis, module breakdowns, forensic rationale, and examiner viva Q&A.
        </p>
      </div>

      {/* Project Synopsis & Abstract */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm text-slate-100">1. Project Abstract</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>File Integrity Monitoring and Threat Detection System</strong> is a cybersecurity application designed to detect, alert, and log unauthorized modifications to critical system and application files. Built with Python Flask, SQLite, and client-side cryptographic interfaces, the system establishes authoritative SHA-256 baselines upon asset registration. Periodic or on-demand integrity scans recalculate cryptographic digests and perform bitwise comparisons against recorded baselines. A deterministic rule-based threat evaluation engine classifies anomalies into four severity tiers (LOW, MEDIUM, HIGH, CRITICAL), explicitly distinguishing file integrity violations from confirmed malware infection. All security events are logged chronologically in SQLite, creating an immutable audit trail suitable for digital forensic analysis and college project demonstrations.
        </p>
      </div>

      {/* Objectives and Technologies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">2. Key Objectives</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
            <li>Establish cryptographic SHA-256 fingerprints for system files and configs.</li>
            <li>Detect content alterations, unauthorized deletions, and dropped executables.</li>
            <li>Implement deterministic rules to prioritize security events by severity.</li>
            <li>Maintain an immutable forensic audit log in SQLite for post-incident review.</li>
            <li>Educate students on the forensic distinction between integrity violations and malware.</li>
          </ul>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">3. Technologies Used</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-cyan-400 font-semibold block text-[11px]">Backend</span>
              <span className="text-slate-300">Python 3 + Flask</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-cyan-400 font-semibold block text-[11px]">Database</span>
              <span className="text-slate-300">SQLite (security.db)</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-cyan-400 font-semibold block text-[11px]">Cryptography</span>
              <span className="text-slate-300">SHA-256 (hashlib / Web Crypto)</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-cyan-400 font-semibold block text-[11px]">Frontend</span>
              <span className="text-slate-300">HTML5, CSS3, JavaScript</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules and Workflow */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">4. System Modules & Workflow</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold font-mono">Module 1: Baselines</span>
            <p className="text-slate-400 text-[11px]">Files are indexed, size & path recorded, initial 256-bit SHA-256 hash computed and committed.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold font-mono">Module 2: Scanner</span>
            <p className="text-slate-400 text-[11px]">Iterates registered assets, calculates real-time hash, checks file existence, detects divergence.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold font-mono">Module 3: Threat Rules</span>
            <p className="text-slate-400 text-[11px]">Evaluates modification patterns, config file status, dropped binaries, and assigns LOW to CRITICAL levels.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-rose-400 font-bold font-mono">Module 4: Triage & Audit</span>
            <p className="text-slate-400 text-[11px]">Stores alerts with Open/Investigating/Resolved states and writes chronological forensic activity logs.</p>
          </div>
        </div>
      </div>

      {/* Viva Assessment Questions Accordion */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              5. Comprehensive College Viva Questions & Model Answers
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">9 Essential Questions</span>
        </div>

        <div className="space-y-2.5">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-3.5 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-slate-850 transition-colors"
                >
                  <span className="pr-4">{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/60">
                    <p className="text-slate-300">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
