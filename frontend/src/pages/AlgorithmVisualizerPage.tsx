import React, { useState, useEffect } from 'react';
import {
  Binary,
  Layers,
  Route,
  Database,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Info,
  ChevronRight,
  RefreshCw,
  GitCommit
} from 'lucide-react';
import { api } from '../services/api';
import { HeapState, HashTableState, DijkstraResult, DijkstraStep, GraphData } from '../types';

export const AlgorithmVisualizerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'heap' | 'dijkstra' | 'hashtable' | 'complexity'>('heap');

  // Min-Heap State
  const [heapState, setHeapState] = useState<HeapState | null>(null);
  const [heapLoading, setHeapLoading] = useState(false);

  // Dijkstra Visualizer State
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [dijkstraSource, setDijkstraSource] = useState('SAKEC Campus');
  const [dijkstraDest, setDijkstraDest] = useState('Vashi');
  const [dijkstraResult, setDijkstraResult] = useState<DijkstraResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Hash Table State
  const [hashTableState, setHashTableState] = useState<HashTableState | null>(null);
  const [searchKey, setSearchKey] = useState('D001');
  const [searchResult, setSearchResult] = useState<string | null>(null);

  // Load Initial Data
  const loadHeap = async () => {
    try {
      setHeapLoading(true);
      const data = await api.getHeapState();
      setHeapState(data);
    } finally {
      setHeapLoading(false);
    }
  };

  const loadGraphAndDijkstra = async (src: string, dst: string) => {
    try {
      const g = await api.getGraph();
      setGraphData(g);
      const res = await api.getDijkstraTrace(src, dst);
      setDijkstraResult(res);
      setCurrentStepIndex(0);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHashTable = async () => {
    try {
      const data = await api.getHashTableState();
      setHashTableState(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHeap();
    loadGraphAndDijkstra(dijkstraSource, dijkstraDest);
    loadHashTable();
  }, []);

  // Dijkstra Step Player
  useEffect(() => {
    let timer: any;
    if (isPlaying && dijkstraResult?.trace) {
      if (currentStepIndex < dijkstraResult.trace.length - 1) {
        timer = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, 1200);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, dijkstraResult]);

  const handleHashSearch = () => {
    if (!hashTableState) return;
    for (const b of hashTableState.buckets) {
      for (const entry of b.entries) {
        if (entry.key.toLowerCase() === searchKey.trim().toLowerCase()) {
          setSearchResult(`Found in Bucket #${b.bucket_index}: "${entry.food_name}" (${entry.quantity} units, Category: ${entry.category})`);
          return;
        }
      }
    }
    setSearchResult(`Key "${searchKey}" not found in hash table.`);
  };

  const currentStep: DijkstraStep | undefined = dijkstraResult?.trace[currentStepIndex];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">DSA Algorithm Visualizer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive educational exploration of the C++ data structures and algorithmic execution traces
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab('heap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'heap' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Min-Heap
          </button>
          <button
            onClick={() => setActiveTab('dijkstra')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'dijkstra' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dijkstra Steps
          </button>
          <button
            onClick={() => setActiveTab('hashtable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'hashtable' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hash Table
          </button>
          <button
            onClick={() => setActiveTab('complexity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'complexity' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Complexity Matrix
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MIN-HEAP (PRIORITY QUEUE) */}
      {/* ======================================================== */}
      {activeTab === 'heap' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Expiry-Aware Min-Heap Priority Queue</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Binary tree where every parent node has an expiry time earlier than or equal to its children.
                  Root node is deterministically popped first during smart matching.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  Heap Size: {heapState?.heap_size || 0} Nodes
                </span>
                <button
                  onClick={loadHeap}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
                  title="Reload Heap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Binary Tree Representation */}
            <div className="mt-5 p-6 bg-slate-50 rounded-xl border border-slate-100 overflow-x-auto min-h-[300px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-4">
                Heap Hierarchy Tree (Parent & Child Relations):
              </span>

              {heapState?.tree_nodes && heapState.tree_nodes.length > 0 ? (
                <div className="flex flex-col items-center gap-6">
                  {/* Root (Index 0) */}
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-emerald-800 text-white rounded-xl shadow-md border-2 border-emerald-600 text-center w-52">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-200 font-bold">
                        [Root] Index 0 • Earliest Expiry
                      </div>
                      <div className="font-bold text-sm mt-0.5">{heapState.tree_nodes[0].id}</div>
                      <div className="text-xs truncate">{heapState.tree_nodes[0].food_name}</div>
                      <div className="mt-1 text-[10px] bg-emerald-950/60 py-0.5 px-1.5 rounded">
                        {heapState.tree_nodes[0].expiry_time?.substring(11, 16)} UTC
                      </div>
                    </div>
                  </div>

                  {/* Level 1 Children (Indices 1 and 2) */}
                  {heapState.tree_nodes.length > 1 && (
                    <div className="flex items-center justify-center gap-12 w-full">
                      {[1, 2].map((idx) => {
                        if (idx >= heapState.tree_nodes.length) return null;
                        const node = heapState.tree_nodes[idx];
                        return (
                          <div
                            key={node.id}
                            className="p-3 bg-white text-slate-800 rounded-xl shadow-xs border border-slate-200 text-center w-48"
                          >
                            <div className="text-[10px] font-mono text-slate-400 font-bold">
                              [Left/Right] Index {idx} • Parent: 0
                            </div>
                            <div className="font-bold text-sm text-slate-900 mt-0.5">{node.id}</div>
                            <div className="text-xs truncate text-slate-600">{node.food_name}</div>
                            <div className="mt-1 text-[10px] bg-slate-100 text-slate-600 py-0.5 px-1.5 rounded">
                              {node.expiry_time?.substring(11, 16)} UTC
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Level 2 Children (Indices 3, 4, 5, 6) */}
                  {heapState.tree_nodes.length > 3 && (
                    <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                      {[3, 4, 5, 6].map((idx) => {
                        if (idx >= heapState.tree_nodes.length) return null;
                        const node = heapState.tree_nodes[idx];
                        return (
                          <div
                            key={node.id}
                            className="p-2.5 bg-white text-slate-800 rounded-lg border border-slate-200 text-center w-40 text-xs shadow-xs"
                          >
                            <div className="text-[9px] font-mono text-slate-400">
                              Idx {idx} (P: {node.parent_index})
                            </div>
                            <div className="font-bold text-slate-900 truncate">{node.id}</div>
                            <div className="text-[11px] truncate text-slate-500">{node.food_name}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">Heap is currently empty.</div>
              )}
            </div>

            {/* Heap Array Representation */}
            <div className="mt-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Sequential Array Layout in Memory (`std::vector&lt;Donation&gt;`):
              </span>
              <div className="overflow-x-auto">
                <div className="inline-flex gap-2 p-2 bg-slate-100/70 rounded-xl border border-slate-200">
                  {heapState?.tree_nodes.map((n, i) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-center shrink-0 w-28 ${
                        i === 0
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] font-mono opacity-80">Index [{i}]</div>
                      <div className="font-bold text-xs truncate mt-0.5">{n.id}</div>
                      <div className="text-[10px] opacity-75 truncate">{n.quantity} {n.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DIJKSTRA STEP-BY-STEP TRACE */}
      {/* ======================================================== */}
      {activeTab === 'dijkstra' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dijkstra Relaxation Step Trace</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed inspection of every edge relaxation and distance vector update returned directly by the C++ engine
                </p>
              </div>

              {/* Player Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 shadow-xs transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isPlaying ? 'Pause' : 'Play Trace'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(0);
                  }}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                  title="Reset to Step 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                  Step {currentStepIndex + 1} / {dijkstraResult?.trace.length || 0}
                </span>
              </div>
            </div>

            {/* Slider Scrubber */}
            <div className="mt-4">
              <input
                type="range"
                min="0"
                max={(dijkstraResult?.trace.length || 1) - 1}
                value={currentStepIndex}
                onChange={(e) => setCurrentStepIndex(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Active Step Card */}
            {currentStep && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step Metadata Card */}
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                    Current Execution Step #{currentStep.step_number}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        currentStep.action === 'RELAX'
                          ? 'bg-emerald-600 text-white'
                          : currentStep.action === 'VISIT'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {currentStep.action}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentStep.current_node}
                    </span>
                  </div>
                  {currentStep.examined_neighbor && (
                    <div className="text-xs text-slate-600 mt-2 space-y-1">
                      <div>Examining neighbor: <span className="font-bold text-slate-800">{currentStep.examined_neighbor}</span></div>
                      <div>Edge Weight: <span className="font-mono font-semibold">{currentStep.edge_weight} km</span></div>
                      <div>Old Dist: <span className="font-mono">{currentStep.old_dist === null || currentStep.old_dist < 0 ? '∞' : `${currentStep.old_dist} km`}</span></div>
                      <div>New Dist: <span className="font-mono font-bold text-emerald-800">{currentStep.new_dist} km</span></div>
                    </div>
                  )}
                </div>

                {/* Distance Snapshot Table (2 Cols) */}
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                    Distance Vector Snapshot at Step #{currentStep.step_number}:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                    {Object.entries(currentStep.snapshot_distances || {}).map(([node, d]) => (
                      <div
                        key={node}
                        className={`p-2 rounded-lg border text-center ${
                          node === currentStep.current_node
                            ? 'bg-emerald-800 text-white border-emerald-900 font-bold'
                            : node === currentStep.examined_neighbor
                            ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] truncate">{node}</div>
                        <div className="font-mono text-xs mt-0.5 font-bold">
                          {d < 0 ? '∞' : `${d.toFixed(1)} km`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HASH TABLE STATE */}
      {/* ======================================================== */}
      {activeTab === 'hashtable' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Hash Table Organization (`std::unordered_map`)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal bucket array and load factor metrics providing average O(1) constant-time entity lookup
                </p>
              </div>

              {/* Stats pill */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  Elements: {hashTableState?.total_elements || 0}
                </span>
                <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200">
                  Load Factor: {hashTableState?.load_factor ? hashTableState.load_factor.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* Interactive Search Simulator */}
            <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700">O(1) Hash Lookup Simulator:</span>
              <input
                type="text"
                placeholder="Enter Donation ID (e.g. D001)"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <button
                onClick={handleHashSearch}
                className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 shadow-xs"
              >
                Inspect Hash Bucket
              </button>
              {searchResult && (
                <span className="text-xs text-emerald-900 font-semibold bg-emerald-100 px-3 py-1 rounded-lg">
                  {searchResult}
                </span>
              )}
            </div>

            {/* Visual Buckets */}
            <div className="mt-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-3">
                Sample Bucket Array Distribution (Chaining for Collision Resolution):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {hashTableState?.buckets.map((b) => (
                  <div
                    key={b.bucket_index}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 pb-2 border-b border-slate-100">
                      <span>Bucket #{b.bucket_index}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                        {b.entry_count} item{b.entry_count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {b.entries.length > 0 ? (
                        b.entries.map((entry) => (
                          <div
                            key={entry.key}
                            className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100 text-xs"
                          >
                            <span className="font-mono font-bold text-emerald-900">{entry.key}</span>
                            <div className="font-semibold text-slate-800 truncate text-[11px] mt-0.5">
                              {entry.food_name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {entry.quantity} units • {entry.category}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-3 text-center text-[10px] text-slate-300 italic">
                          (Empty Bucket)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: COMPLEXITY MATRIX */}
      {/* ======================================================== */}
      {activeTab === 'complexity' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Data Structure & Algorithm Complexity Analysis
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Theoretical bounds and engineering tradeoffs implemented in the C++ backend
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Component / Algorithm</th>
                    <th className="py-3 px-4">C++ Data Structure</th>
                    <th className="py-3 px-4">Average Time</th>
                    <th className="py-3 px-4">Worst Case Time</th>
                    <th className="py-3 px-4">Space Complexity</th>
                    <th className="py-3 px-4">Redistribution Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Entity Lookup & Caching</td>
                    <td className="py-3 px-4 font-mono text-emerald-800">std::unordered_map</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">O(1)</td>
                    <td className="py-3 px-4 font-mono text-amber-700">O(N) (hash collision)</td>
                    <td className="py-3 px-4 font-mono">O(N)</td>
                    <td className="py-3 px-4 text-slate-600">
                      Instantaneous retrieval of donations & recipients by unique ID
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Expiry Prioritization</td>
                    <td className="py-3 px-4 font-mono text-emerald-800">ExpiryMinHeap (Binary Tree)</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">O(log N) pop/push</td>
                    <td className="py-3 px-4 font-mono text-emerald-700">O(log N)</td>
                    <td className="py-3 px-4 font-mono">O(N)</td>
                    <td className="py-3 px-4 text-slate-600">
                      Always extracts food batch with earliest expiry epoch first
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Shortest Route Routing</td>
                    <td className="py-3 px-4 font-mono text-emerald-800">Dijkstra + Priority Queue</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">O((V + E) log V)</td>
                    <td className="py-3 px-4 font-mono text-emerald-700">O((V + E) log V)</td>
                    <td className="py-3 px-4 font-mono">O(V + E)</td>
                    <td className="py-3 px-4 text-slate-600">
                      Calculates minimum road transport distance across Mumbai network
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900">Candidate Ranking</td>
                    <td className="py-3 px-4 font-mono text-emerald-800">std::sort (Introsort)</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">O(K log K)</td>
                    <td className="py-3 px-4 font-mono text-emerald-700">O(K log K)</td>
                    <td className="py-3 px-4 font-mono">O(log K)</td>
                    <td className="py-3 px-4 text-slate-600">
                      Ranks K compatible candidates by recipient priority, then distance
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
