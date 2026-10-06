import React from 'react';
import { X, CloudUpload, Github, Terminal, Key, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google AI Studio Deployment & GitHub Sync</h3>
              <p className="text-xs text-zinc-400">
                Polo Forge Cloud Run Architecture & Production Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs text-zinc-300">
          {/* Step 1: Deploy to Cloud Run */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
              <CloudUpload className="w-4 h-4" />
              <span>1. Direct One-Click Cloud Run Deployment</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              In Google AI Studio, click the <strong className="text-white">Publish</strong> button in the top-right corner.
              AI Studio automatically builds a production container and hosts Polo Forge on Google Cloud Run with an HTTPS endpoint.
            </p>
            <div className="p-2.5 rounded-lg bg-zinc-900 font-mono text-[11px] text-zinc-300 flex items-center justify-between">
              <span>Cloud Run Service URL: Injected automatically via $APP_URL</span>
              <span className="text-emerald-400 text-[10px]">Starter Tier: 2 Free Apps</span>
            </div>
          </div>

          {/* Step 2: GitHub Two-Way Sync */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
              <Github className="w-4 h-4" />
              <span>2. GitHub Two-Way Sync</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Connect this applet directly to your personal or organization repository in AI Studio:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Open <strong>Settings &rarr; GitHub</strong> in AI Studio.</li>
              <li>Authenticate your GitHub account and select or create a new repo (e.g. <code className="text-zinc-200">polo-forge</code>).</li>
              <li>AI Studio will continuously push code revisions with AI-generated commit messages.</li>
            </ul>
          </div>

          {/* Step 3: API Key Management */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
              <Key className="w-4 h-4" />
              <span>3. API Key & Security Constraints</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Your <code className="text-amber-300">GEMINI_API_KEY</code> is managed strictly on the server-side proxy route and never exposed in client bundles.
              For Lyria 3.5 access, ensure your Gemini project has paid access or quota configured in AI Studio Secrets.
            </p>
          </div>

          {/* Step 4: Local Development */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
              <Terminal className="w-4 h-4" />
              <span>4. Local Testing via ZIP Export</span>
            </div>
            <p className="text-zinc-400">
              If exporting ZIP from AI Studio for local command-line development:
            </p>
            <div className="p-3 bg-zinc-900 rounded-lg font-mono text-[11px] text-zinc-300 space-y-1">
              <p>export GEMINI_API_KEY=&quot;your_gemini_key&quot;</p>
              <p>npm install</p>
              <p>npm run dev</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
