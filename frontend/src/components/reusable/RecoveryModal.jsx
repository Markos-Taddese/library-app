import React, { useState } from 'react';
const RecoveryModal = ({ recoveryKey, onNavigate }) => {
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
  await navigator.clipboard.writeText(recoveryKey);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="w-full max-w-sm border border-zinc-800 bg-zinc-900 p-6">
        <p className="mb-4 text-xs leading-relaxed text-zinc-400">
            The following key is required for account recovery. It is only displayed once and is encrypted in the database. Failure to store this key will result in permanent loss of access if credentials are lost.
          </p>
      <div className="mb-6 flex border border-zinc-800 bg-zinc-950">
        <div className="flex-1 p-3 font-mono text-sm text-zinc-200 break-all">
            {recoveryKey}
           </div>
        <button
            onClick={handleCopy}
            className="border-l border-zinc-800 px-4 text-[10px] font-bold uppercase text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            {copied ? 'Done' : 'Copy'}
          </button>
        </div>
        <button
          onClick={onNavigate}
className="w-full border border-zinc-700 bg-zinc-800 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-100 hover:border-zinc-500 hover:bg-zinc-700 active:scale-[0.99] transition-all"        >
          Proceed to Login
        </button>
        </div>
    </div>
  );
};

export default RecoveryModal;