/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Radio, Database, Clock, Cpu, FileJson, History, RefreshCw, CheckCircle2 } from 'lucide-react';
import { BatDeviceStatus } from '../lib/types';

export default function BatDeviceStatusPanel() {
  const [latestStatus, setLatestStatus] = useState<BatDeviceStatus | null>(null);
  const [history, setHistory] = useState<BatDeviceStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchBatStatusData = async () => {
    try {
      setIsRefreshing(true);
      const [latestRes, historyRes] = await Promise.all([
        fetch('/api/bat-status/latest'),
        fetch('/api/bat-status/history')
      ]);

      if (latestRes.ok) {
        const latestJson = await latestRes.json();
        if (latestJson.success && latestJson.data) {
          setLatestStatus(latestJson.data);
        }
      }

      if (historyRes.ok) {
        const historyJson = await historyRes.json();
        if (historyJson.success && Array.isArray(historyJson.data)) {
          setHistory(historyJson.data);
        }
      }
    } catch (err) {
      console.error('[BatDeviceStatusPanel] Failed to fetch bat status:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatStatusData();
    const interval = setInterval(fetchBatStatusData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-stone-900 border border-stone-800 text-stone-200 p-5 rounded-xs shadow-md space-y-4 font-mono text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-purple-950 border border-purple-800/80 rounded-[2px] text-purple-400">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-100">Bat Device Service (acoupi-bat)</span>
              <span className="bg-purple-950 text-purple-300 border border-purple-700/80 px-2 py-0.5 rounded-[2px] text-[10px] font-bold">
                UCL/GordonStreet/acoupi-bat
              </span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              Backend MQTT Collector Service &bull; Broker: <strong className="text-emerald-400">mqtt.cetools.org:1883</strong> &bull; Table: <strong className="text-purple-300">bat_device_status</strong>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchBatStatusData}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 px-2.5 py-1 rounded-[2px] text-[10px] cursor-pointer transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-purple-400' : 'text-stone-400'} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Latest Device Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Main Status Block */}
        <div className="md:col-span-7 bg-stone-950 border border-stone-800 p-3.5 rounded-[2px] space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Latest Device Status (GET /api/bat-status/latest)
            </span>
            <span className="text-[9px] text-stone-500 font-mono">
              Table Row #{history.length}
            </span>
          </div>

          {latestStatus ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-stone-900 border border-stone-800/80 rounded-[2px]">
                <div className="text-[9px] text-stone-500 uppercase font-bold flex items-center gap-1">
                  <Cpu size={10} className="text-purple-400" />
                  <span>Device ID</span>
                </div>
                <div className="text-purple-300 font-bold truncate mt-0.5">
                  {latestStatus.device_id || 'acoupi-bat-01'}
                </div>
              </div>

              <div className="p-2 bg-stone-900 border border-stone-800/80 rounded-[2px]">
                <div className="text-[9px] text-stone-500 uppercase font-bold flex items-center gap-1">
                  <Clock size={10} className="text-emerald-400" />
                  <span>Sent On</span>
                </div>
                <div className="text-stone-200 font-bold truncate mt-0.5">
                  {latestStatus.sent_on ? new Date(latestStatus.sent_on).toLocaleTimeString() : 'N/A'}
                </div>
              </div>

              <div className="p-2 bg-stone-900 border border-stone-800/80 rounded-[2px] col-span-2 sm:col-span-1">
                <div className="text-[9px] text-stone-500 uppercase font-bold flex items-center gap-1">
                  <Database size={10} className="text-amber-400" />
                  <span>Received At</span>
                </div>
                <div className="text-amber-300 font-bold truncate mt-0.5">
                  {new Date(latestStatus.received_at).toLocaleTimeString()}
                </div>
              </div>

              {/* Status Payload Object View */}
              <div className="col-span-2 sm:col-span-3 p-2 bg-stone-900 border border-stone-800/80 rounded-[2px] space-y-1">
                <div className="text-[9px] text-stone-500 uppercase font-bold flex items-center gap-1">
                  <FileJson size={10} className="text-sky-400" />
                  <span>Parsed Status Payload</span>
                </div>
                <pre className="text-[10px] text-purple-200 bg-stone-950 p-2 rounded-[2px] overflow-x-auto max-h-24 font-mono">
                  {typeof latestStatus.status === 'object' 
                    ? JSON.stringify(latestStatus.status, null, 2) 
                    : String(latestStatus.status)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-stone-500">
              Awaiting latest status payload...
            </div>
          )}
        </div>

        {/* Database Table Raw Payload Info */}
        <div className="md:col-span-5 bg-stone-950 border border-stone-800 p-3.5 rounded-[2px] flex flex-col justify-between space-y-2">
          <div className="space-y-1.5">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold flex items-center gap-1.5 border-b border-stone-800/80 pb-2">
              <Database size={13} className="text-purple-400" />
              <span>bat_device_status DB Schema</span>
            </div>
            <p className="text-[10px] text-stone-400 leading-relaxed font-serif">
              Every message published to <code className="text-purple-300 bg-stone-900 px-1">UCL/GordonStreet/acoupi-bat</code> is appended as a new row with <code className="text-emerald-300 bg-stone-900 px-1">sent_on</code>, <code className="text-emerald-300 bg-stone-900 px-1">device_id</code>, <code className="text-emerald-300 bg-stone-900 px-1">status</code>, <code className="text-emerald-300 bg-stone-900 px-1">received_at</code>, and <code className="text-emerald-300 bg-stone-900 px-1">raw_payload</code>.
            </p>
          </div>

          <div className="bg-stone-900 p-2 border border-stone-800 rounded-[2px] text-[10px]">
            <span className="text-stone-500 font-bold block mb-0.5">Raw Payload (Preserved):</span>
            <div className="text-stone-300 truncate font-mono">
              {latestStatus?.raw_payload || '{"sent_on": "...", "device_id": "acoupi-bat-01", "status": {...}}'}
            </div>
          </div>
        </div>

      </div>

      {/* History Log Table (GET /api/bat-status/history) */}
      <div className="space-y-2 pt-2 border-t border-stone-800">
        <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider font-bold">
          <span className="flex items-center gap-1.5">
            <History size={13} className="text-purple-400" />
            <span>Bat Device Status History Log (GET /api/bat-status/history)</span>
          </span>
          <span className="text-stone-500 font-mono">
            {history.length} Total Appended Rows
          </span>
        </div>

        {history.length > 0 ? (
          <div className="max-h-48 overflow-y-auto border border-stone-800 rounded-[2px] bg-stone-950">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead className="bg-stone-900 text-stone-400 sticky top-0 border-b border-stone-800">
                <tr>
                  <th className="p-2 font-mono uppercase">Received At</th>
                  <th className="p-2 font-mono uppercase">Device ID</th>
                  <th className="p-2 font-mono uppercase">Sent On</th>
                  <th className="p-2 font-mono uppercase">Topic</th>
                  <th className="p-2 font-mono uppercase">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900 text-stone-300 font-mono">
                {history.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-stone-900/60">
                    <td className="p-2 text-amber-300 whitespace-nowrap">
                      {new Date(item.received_at).toLocaleTimeString()}
                    </td>
                    <td className="p-2 text-purple-300 font-bold whitespace-nowrap">
                      {item.device_id || 'acoupi-bat-01'}
                    </td>
                    <td className="p-2 text-stone-400 whitespace-nowrap">
                      {item.sent_on ? new Date(item.sent_on).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="p-2 text-emerald-400 whitespace-nowrap">
                      {item.topic}
                    </td>
                    <td className="p-2 text-stone-300 truncate max-w-xs" title={item.raw_payload}>
                      {item.raw_payload}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 bg-stone-950 border border-stone-800 text-stone-500 text-center rounded-[2px]">
            No historical records stored in <code className="text-purple-300">bat_device_status</code> table yet.
          </div>
        )}
      </div>

    </div>
  );
}
