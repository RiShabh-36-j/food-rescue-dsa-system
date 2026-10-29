import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  ArrowRight,
  Route,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { api } from '../services/api';
import { GraphData, DijkstraResult } from '../types';

export const RoutePlannerPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [sourceNode, setSourceNode] = useState<string>('SAKEC Campus');
  const [destNode, setDestNode] = useState<string>('Vashi');
  const [routeResult, setRouteResult] = useState<DijkstraResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraphAndCalculate = async (src: string, dst: string) => {
    try {
      setLoading(true);
      setError(null);
      const graph = await api.getGraph();
      setGraphData(graph);

      if (src && dst) {
        const result = await api.calculateRoute(src, dst);
        setRouteResult(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate shortest path.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphAndCalculate(sourceNode, destNode);
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceNode === destNode) {
      setError('Source and Destination must be distinct nodes.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.calculateRoute(sourceNode, destNode);
      setRouteResult(res);
    } catch (err: any) {
      setError(err.message || 'Route calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Check if an edge is part of the computed shortest path
  const isEdgeInPath = (u: string, v: string) => {
    if (!routeResult || !routeResult.reachable || !routeResult.path) return false;
    const path = routeResult.path;
    for (let i = 0; i < path.length - 1; i++) {
      if (
        (path[i] === u && path[i + 1] === v) ||
        (path[i] === v && path[i + 1] === u)
      ) {
        return true;
      }
    }
    return false;
  };

  const isNodeInPath = (nodeName: string) => {
    if (!routeResult || !routeResult.reachable || !routeResult.path) return false;
    return routeResult.path.includes(nodeName);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Graph Routing & Urban Transit Planner
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            C++ Dijkstra implementation over weighted Mumbai transportation network graph
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
          <Info className="w-3.5 h-3.5" />
          <span>Synthetic Demonstration Distances</span>
        </div>
      </div>

      {/* Route Control Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleCalculate} className="flex flex-wrap items-end gap-4">
          {/* Source Location */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Source (Donor Food Outlet)</span>
            </label>
            <select
              value={sourceNode}
              onChange={(e) => setSourceNode(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {graphData?.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Location */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              <span>Destination (Recipient NGO Shelter)</span>
            </label>
            <select
              value={destNode}
              onChange={(e) => setDestNode(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {graphData?.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Route className="w-3.5 h-3.5" />}
            <span>Run Dijkstra Shortest Route</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main 2-Column: SVG Weighted Graph & Route Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Interactive Weighted Graph View (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Mumbai Regional Weighted Road Graph</h3>
              <p className="text-[11px] text-slate-500">
                11 Hub Vertices • Green paths highlight the computed optimal route
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <span className="w-3 h-0.5 bg-slate-300 inline-block" /> Regular Edge
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
                <span className="w-3 h-1 bg-emerald-600 inline-block rounded" /> Shortest Path
              </span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full h-[460px] bg-slate-50/60 rounded-xl border border-slate-100 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 620 440">
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
                </filter>
              </defs>

              {/* Draw Edges */}
              {graphData?.edges.map((edge, idx) => {
                const u = graphData.nodes.find((n) => n.id === edge.source);
                const v = graphData.nodes.find((n) => n.id === edge.target);
                if (!u || !v) return null;

                const inPath = isEdgeInPath(edge.source, edge.target);
                const midX = (u.x + v.x) / 2;
                const midY = (u.y + v.y) / 2;

                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke={inPath ? '#16a34a' : '#cbd5e1'}
                      strokeWidth={inPath ? 3.5 : 1.8}
                      strokeDasharray={inPath ? undefined : '3,3'}
                      className="transition-all duration-300"
                    />
                    {/* Weight Label Box */}
                    <rect
                      x={midX - 14}
                      y={midY - 9}
                      width={28}
                      height={18}
                      rx={4}
                      fill={inPath ? '#166534' : '#ffffff'}
                      stroke={inPath ? '#166534' : '#e2e8f0'}
                      strokeWidth={1}
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight="bold"
                      fill={inPath ? '#ffffff' : '#64748b'}
                      fontFamily="system-ui"
                    >
                      {edge.distance_km}
                    </text>
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {graphData?.nodes.map((node) => {
                const inPath = isNodeInPath(node.id);
                const isSource = node.id === sourceNode;
                const isDest = node.id === destNode;

                let fillColor = '#ffffff';
                let strokeColor = '#94a3b8';
                let textColor = '#334155';

                if (isSource) {
                  fillColor = '#166534';
                  strokeColor = '#14532d';
                  textColor = '#166534';
                } else if (isDest) {
                  fillColor = '#0f766e';
                  strokeColor = '#115e59';
                  textColor = '#0f766e';
                } else if (inPath) {
                  fillColor = '#22c55e';
                  strokeColor = '#16a34a';
                  textColor = '#15803d';
                }

                return (
                  <g
                    key={`node-${node.id}`}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (sourceNode !== node.id) setDestNode(node.id);
                    }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSource || isDest ? 14 : inPath ? 12 : 9}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={2.5}
                      filter="url(#shadow)"
                      className="transition-all duration-200"
                    />
                    {(isSource || isDest) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={20}
                        fill="none"
                        stroke={isSource ? '#16a34a' : '#0f766e'}
                        strokeWidth={1.5}
                        strokeDasharray="2,2"
                        className="animate-pulse"
                      />
                    )}
                    {/* Node Text Label */}
                    <text
                      x={node.x}
                      y={node.y + (isSource || isDest ? 24 : 20)}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={isSource || isDest || inPath ? 'bold' : 'normal'}
                      fill={textColor}
                      className="select-none pointer-events-none"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Shortest Route Output Card (1 Column) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Dijkstra Route Result</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  routeResult?.reachable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {routeResult?.reachable ? 'PATH FOUND' : 'UNREACHABLE'}
              </span>
            </div>

            {routeResult?.reachable ? (
              <div className="mt-4 space-y-4">
                {/* Distance Card */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[11px] font-medium text-emerald-800">
                    Minimum Road Network Distance
                  </span>
                  <p className="text-3xl font-extrabold text-emerald-950 mt-1">
                    {routeResult.total_distance.toFixed(1)}{' '}
                    <span className="text-sm font-normal text-emerald-800">km</span>
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-1">
                    {routeResult.path.length - 1} transit road hop{routeResult.path.length - 1 !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Path Nodes Sequence */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    Turn-By-Turn Node Sequence:
                  </span>
                  <div className="space-y-2">
                    {routeResult.path.map((node, i) => (
                      <div key={node} className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            i === 0
                              ? 'bg-emerald-800 text-white'
                              : i === routeResult.path.length - 1
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`font-medium ${
                            i === 0 || i === routeResult.path.length - 1
                              ? 'text-slate-900 font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          {node}
                        </span>
                        {i < routeResult.path.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation text */}
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                  <p className="leading-relaxed">
                    <span className="font-semibold text-slate-800">Algorithm Rationale: </span>
                    Dijkstra priority queue examined adjacent edges and minimized cumulative road weights to ensure rapid food transfer prior to thermal or temporal decay.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No Connected Path Exists</h4>
                <p className="text-slate-400 mt-1">
                  Selected node is isolated or lacks connected road edges in the current weighted graph.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            Algorithm Complexity: <code className="text-slate-600 font-mono">O((V + E) log V)</code>
          </div>
        </div>
      </div>
    </div>
  );
};
