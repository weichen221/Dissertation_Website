/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MqttState } from '../lib/useMqtt';
import { Radio, RefreshCw, AlertCircle, CheckCircle, WifiOff, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface MqttLivePanelProps {
  mqttState: MqttState;
}

export function MqttLivePanel({ mqttState }: MqttLivePanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const getStatusBadge = () => {
    switch (mqttState.status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-emerald-950 text-emerald-300 border border-emerald-700/80 text-xs font-mono font-bold">
            <CheckCircle size={13} className="text-emerald-400" />
            <span>CONNECTED</span>
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-amber-950 text-amber-300 border border-amber-700/80 text-xs font-mono font-bold animate-pulse">
            <RefreshCw size={13} className="animate-spin text-amber-400" />
            <span>CONNECTING</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-rose-950 text-rose-300 border border-rose-700/80 text-xs font-mono font-bold">
            <AlertCircle size={13} className="text-rose-400" />
            <span>ERROR</span>
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-stone-800 text-stone-300 border border-stone-700 text-xs font-mono font-bold">
            <WifiOff size={13} className="text-stone-400" />
            <span>DISCONNECTED</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 text-stone-200 rounded-xs shadow-md overflow-hidden font-mono text-xs">
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-stone-900 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-[2px]">
            <Radio size={16} className={mqttState.status === 'connected' ? 'animate-pulse text-emerald-400' : ''} />
          </div>
          <div>
            <div className="font-bold text-stone-100 flex items-center gap-2">
              <span>LIVE MQTT TELEMETRY STREAM</span>
              {getStatusBadge()}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              Broker: <span className="text-emerald-400 font-bold">{mqttState.brokerUrl || 'ws://mqtt.cetools.org:8080'}</span> | Subscribed: <span className="text-purple-300 font-bold">UCL/GordonStreet/#</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-[10px] text-stone-400 hidden sm:block">
            <div>Total Messages: <strong className="text-emerald-300 font-mono">{mqttState.messageCount}</strong></div>
            <div>Last Updated: <strong className="text-stone-200 font-mono">{mqttState.lastMessageTime ? new Date(mqttState.lastMessageTime).toLocaleTimeString() : 'Awaiting data...'}</strong></div>
          </div>
          <button className="text-stone-400 hover:text-stone-200 p-1">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-stone-900">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-[2px]">
              <span className="block text-[10px] text-stone-500 uppercase tracking-wider font-bold">Last Received Time</span>
              <span className="text-stone-200 font-mono font-bold mt-0.5 block truncate">
                {mqttState.lastMessageTime ? new Date(mqttState.lastMessageTime).toLocaleString() : 'Awaiting payload'}
              </span>
            </div>

            <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-[2px]">
              <span className="block text-[10px] text-stone-500 uppercase tracking-wider font-bold">Last Received Topic</span>
              <span className="text-emerald-400 font-mono font-bold mt-0.5 block truncate">
                {mqttState.lastTopic || 'None'}
              </span>
            </div>

            <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-[2px]">
              <span className="block text-[10px] text-stone-500 uppercase tracking-wider font-bold">Last Received Message Payload</span>
              <span className="text-purple-300 font-mono font-bold mt-0.5 block truncate">
                {mqttState.lastPayload !== null 
                  ? (typeof mqttState.lastPayload === 'object' ? JSON.stringify(mqttState.lastPayload) : String(mqttState.lastPayload))
                  : 'None'}
              </span>
            </div>
          </div>

          {mqttState.lastError && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-[2px] flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              <span>MQTT Error: {mqttState.lastError}</span>
            </div>
          )}

          {/* Recent 20 Messages List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-stone-400 tracking-wider font-bold">
              <span className="flex items-center gap-1">
                <Terminal size={12} className="text-emerald-400" />
                <span>Recent 20 Messages Log</span>
              </span>
              <span className="text-stone-500">Auto-updating Live Feed</span>
            </div>

            {mqttState.recentMessages.length > 0 ? (
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 font-mono text-[10px] border border-stone-800 p-1 bg-stone-950 rounded-[2px]">
                {mqttState.recentMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="p-2 bg-stone-900 border border-stone-800/80 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-stone-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold shrink-0 text-[9px]">
                        TOPIC
                      </span>
                      <span className="text-emerald-300 font-bold truncate">
                        {msg.topic}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-stone-300">
                      <span className="text-purple-200 font-mono font-bold bg-stone-950 px-2 py-0.5 border border-stone-800 rounded-[1px] truncate max-w-[280px]">
                        {msg.rawMessage}
                      </span>
                      <span className="text-[9px] text-stone-500 shrink-0">
                        {new Date(msg.receivedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-stone-950 border border-stone-800 text-center text-stone-500 rounded-[2px] space-y-1">
                <p>Listening on <strong className="text-emerald-400">wss://mqtt.cetools.org:8081</strong> (HTTP: ws://mqtt.cetools.org:8080)</p>
                <p className="text-[10px]">Awaiting CETools sensor broadcasts on <span className="text-purple-300">UCL/GordonStreet/#</span> and <span className="text-purple-300">UCL/GordonStreet/acoupi-bird</span>...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

