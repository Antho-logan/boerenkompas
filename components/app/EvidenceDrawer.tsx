"use client"

import type { SVGProps } from "react";
import { AICheck } from "@/lib/types";
import { X, FileText, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
    check: AICheck | null;
    isOpen: boolean;
    onClose: () => void;
}

export function EvidenceDrawer({ check, isOpen, onClose }: Props) {
    if (!isOpen || !check) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={
                                check.severity === 'high' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                                    check.severity === 'medium' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                                        'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }>
                                {check.severity.toUpperCase()} Priority
                            </Badge>
                            <span className="text-xs font-mono text-slate-400">ID: {check.id}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{check.title}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-900">
                        <X size={20} />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Summary */}
                    <section>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Analyse & Conclusie</h4>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed">
                            {check.summary}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            AI Confidence Score: <span className="font-bold text-slate-900">{check.confidence}%</span>
                        </div>
                    </section>

                    {/* Evidence: Rules */}
                    <section>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <BookOpen size={16} className="text-slate-400" />
                            Wettelijke Kaders
                        </h4>
                        {check.evidence.rules.length > 0 ? (
                            <ul className="space-y-2">
                                {check.evidence.rules.map((rule, i) => (
                                    <li key={i} className="flex items-start justify-between group p-3 rounded border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{rule.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Versie: {rule.ruleset_version_id}</p>
                                        </div>
                                        {rule.url && (
                                            <a href={rule.url} target="_blank" rel="noopener" className="text-slate-400 hover:text-blue-600">
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Geen specifieke wetgeving gekoppeld.</p>
                        )}
                    </section>

                    {/* Evidence: Docs */}
                    <section>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            Gebruikte Documenten
                        </h4>
                        {check.evidence.docs.length > 0 ? (
                            <ul className="space-y-2">
                                {check.evidence.docs.map((doc, i) => (
                                    <li key={i} className="flex items-center gap-3 p-3 rounded border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                                        <div className="size-8 bg-white border border-slate-200 rounded flex items-center justify-center text-rose-500">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{doc.filename}</p>
                                            {doc.pageNumber && <p className="text-xs text-slate-500">Pagina {doc.pageNumber}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Geen documenten gebruikt als bewijs.</p>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                        Markeer als Gelezen
                    </Button>
                </div>

            </div>
        </div>
    );
}

function ShieldCheck({ className, size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
