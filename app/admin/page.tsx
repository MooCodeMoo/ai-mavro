"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Rule = {
  id: number;
  substrate: string;
  contamination: string;
  product_name: string;
  dilution: string;
  application_steps: string[];
  safety_guidelines: string;
  created_at: string;
  updated_at: string;
};

type Analysis = {
  id: number;
  detected_substrate: string | null;
  detected_contamination: string | null;
  ai_confidence: number | null;
  ai_notes: string | null;
  selected_substrate: string | null;
  selected_contamination: string | null;
  recommended_product: string | null;
  created_at: string;
};

type Statistics = {
  total: number;
  saved: number;
  averageConfidence: number;
  topContaminations: Array<{ detected_contamination: string; count: number }>;
  topSurfaces: Array<{ detected_substrate: string; count: number }>;
  recentAnalyses: Analysis[];
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "rules" | "analyses">("dashboard");
  const [rules, setRules] = useState<Rule[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  const [formData, setFormData] = useState({
    substrate: "",
    contamination: "",
    productName: "",
    dilution: "",
    applicationSteps: [""],
    safetyGuidelines: "",
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const statsRes = await fetch("/api/analyses?action=stats");
        const statsData = await statsRes.json();
        setStatistics(statsData.statistics);
      } else if (activeTab === "rules") {
        const rulesRes = await fetch("/api/rules");
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
      } else if (activeTab === "analyses") {
        const analysesRes = await fetch("/api/analyses");
        const analysesData = await analysesRes.json();
        setAnalyses(analysesData.analyses || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Rule added successfully!");
        setShowAddRule(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error("Error adding rule:", error);
      alert("Failed to add rule");
    }
  }

  async function handleUpdateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRule) return;

    try {
      const res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRule.id,
          ...formData,
        }),
      });

      if (res.ok) {
        alert("Rule updated successfully!");
        setEditingRule(null);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error("Error updating rule:", error);
      alert("Failed to update rule");
    }
  }

  async function handleDeleteRule(id: number) {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const res = await fetch(`/api/rules?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Rule deleted successfully!");
        loadData();
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      alert("Failed to delete rule");
    }
  }

  function startEditRule(rule: Rule) {
    setEditingRule(rule);
    setFormData({
      substrate: rule.substrate,
      contamination: rule.contamination,
      productName: rule.product_name,
      dilution: rule.dilution,
      applicationSteps: rule.application_steps,
      safetyGuidelines: rule.safety_guidelines,
    });
    setShowAddRule(true);
  }

  function resetForm() {
    setFormData({
      substrate: "",
      contamination: "",
      productName: "",
      dilution: "",
      applicationSteps: [""],
      safetyGuidelines: "",
    });
  }

  function addStep() {
    setFormData({
      ...formData,
      applicationSteps: [...formData.applicationSteps, ""],
    });
  }

  function updateStep(index: number, value: string) {
    const newSteps = [...formData.applicationSteps];
    newSteps[index] = value;
    setFormData({ ...formData, applicationSteps: newSteps });
  }

  function removeStep(index: number) {
    const newSteps = formData.applicationSteps.filter((_, i) => i !== index);
    setFormData({ ...formData, applicationSteps: newSteps });
  }

  async function exportData() {
    try {
      const res = await fetch("/api/analyses?action=export");
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data.analyses, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mavro-ai-export-${new Date().toISOString()}.json`;
      a.click();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/mavro-logo.png" alt="Mavro" width={120} height={32} priority className="h-8 w-auto" />
              <div className="h-8 w-px bg-slate-300"></div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            </div>
        <a href="/" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition">
              Back to App
            </a>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === "dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === "rules"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              📋 Product Rules
            </button>
            <button
              onClick={() => setActiveTab("analyses")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === "analyses"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              🔍 Analysis Archive
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && statistics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Analyses</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{statistics.total}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Saved Cases</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{statistics.saved}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Avg. Confidence</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {Math.round(statistics.averageConfidence * 100)}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Top Contaminations</h3>
                    <div className="space-y-3">
                      {statistics.topContaminations && statistics.topContaminations.length > 0 ? (
                        statistics.topContaminations.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">{item.detected_contamination}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{
                                    width: `${(item.count / statistics.topContaminations[0].count) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-slate-900 w-8 text-right">{item.count}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No data yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Top Surfaces</h3>
                    <div className="space-y-3">
                      {statistics.topSurfaces && statistics.topSurfaces.length > 0 ? (
                        statistics.topSurfaces.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">{item.detected_substrate}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600"
                                  style={{
                                    width: `${(item.count / statistics.topSurfaces[0].count) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-slate-900 w-8 text-right">{item.count}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No data yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {statistics.recentAnalyses && statistics.recentAnalyses.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900">Recent Analyses</h3>
                      <button
                        onClick={exportData}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        Export All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Surface</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Contamination</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.recentAnalyses.map((analysis) => (
                            <tr key={analysis.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-sm text-slate-700">
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-700">{analysis.detected_substrate || "-"}</td>
                              <td className="py-3 px-4 text-sm text-slate-700">{analysis.detected_contamination || "-"}</td>
                              <td className="py-3 px-4 text-sm">
                                {analysis.ai_confidence ? (
                                  <span className="text-emerald-600 font-semibold">
                                    {Math.round(analysis.ai_confidence * 100)}%
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "rules" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Product Rules ({rules.length})</h2>
                  <button
                    onClick={() => {
                      setShowAddRule(true);
                      setEditingRule(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    + Add New Rule
                  </button>
                </div>

                {rules.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200">
                    <p className="text-slate-600">No rules yet. Click "Add New Rule" to create one!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{rule.product_name}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {rule.substrate} + {rule.contamination}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditRule(rule)}
                              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-700">
                            <strong>Dilution:</strong> {rule.dilution}
                          </p>
                          <div>
                            <strong className="text-sm text-slate-700">Steps:</strong>
                            <ol className="list-decimal list-inside text-sm text-slate-700 mt-1 space-y-1">
                              {rule.application_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                          <p className="text-sm text-slate-700">
                            <strong>Safety:</strong> {rule.safety_guidelines}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showAddRule && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900">
                          {editingRule ? "Edit Rule" : "Add New Rule"}
                        </h3>
                        <button
                          onClick={() => {
                            setShowAddRule(false);
                            setEditingRule(null);
                            resetForm();
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <form onSubmit={editingRule ? handleUpdateRule : handleAddRule} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Surface Type</label>
                          <input
                            type="text"
                            required
                            value={formData.substrate}
                            onChange={(e) => setFormData({ ...formData, substrate: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contamination Type</label>
                          <input
                            type="text"
                            required
                            value={formData.contamination}
                            onChange={(e) => setFormData({ ...formData, contamination: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                          <input
                            type="text"
                            required
                            value={formData.productName}
                            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Dilution</label>
                          <input
                            type="text"
                            required
                            value={formData.dilution}
                            onChange={(e) => setFormData({ ...formData, dilution: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">Application Steps</label>
                            <button
                              type="button"
                              onClick={addStep}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              + Add Step
                            </button>
                          </div>
                          {formData.applicationSteps.map((step, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                required
                                value={step}
                                onChange={(e) => updateStep(index, e.target.value)}
                                placeholder={`Step ${index + 1}`}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {formData.applicationSteps.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeStep(index)}
                                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Safety Guidelines</label>
                          <textarea
                            required
                            value={formData.safetyGuidelines}
                            onChange={(e) => setFormData({ ...formData, safetyGuidelines: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                          >
                            {editingRule ? "Update Rule" : "Add Rule"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddRule(false);
                              setEditingRule(null);
                              resetForm();
                            }}
                            className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analyses" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Analysis Archive ({analyses.length})</h2>
                  <button
                    onClick={exportData}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Export JSON
                  </button>
                </div>

                {analyses.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200">
                    <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-600">No analyses yet. Save some analyses from the main app!</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">ID</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Surface</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Contamination</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Confidence</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Product</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyses.map((analysis) => (
                            <tr key={analysis.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-sm text-slate-700">{analysis.id}</td>
                              <td className="py-3 px-4 text-sm text-slate-700">
                                {new Date(analysis.created_at).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-700">{analysis.detected_substrate || "-"}</td>
                              <td className="py-3 px-4 text-sm text-slate-700">{analysis.detected_contamination || "-"}</td>
                              <td className="py-3 px-4 text-sm">
                                {analysis.ai_confidence ? (
                                  <span className="text-emerald-600 font-semibold">
                                    {Math.round(analysis.ai_confidence * 100)}%
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-700">{analysis.recommended_product || "-"}</td>
                              <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                                {analysis.ai_notes || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}