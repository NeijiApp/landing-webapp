"use client";

import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { MobileAudioHandler } from '~/lib/audio/mobile-audio-handler';
import { BACKGROUND_NOISE_CONFIGS } from '~/lib/audio/background-noise';

export default function DebugMobileAudioPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<any>(null);

  useEffect(() => {
    // Update mobile status
    const updateStatus = () => {
      setMobileStatus(MobileAudioHandler.getMobileAudioStatus());
    };
    
    updateStatus();
    
    // Update status every second
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const testMobileAudio = async () => {
    setLoading(true);
    setResults([]);

    const audioFiles = BACKGROUND_NOISE_CONFIGS.map(config => config.file);
    const testResults = [];

    for (const filePath of audioFiles) {
      try {
        console.log('Testing mobile audio:', filePath);
        
        const result = await MobileAudioHandler.loadAudioForMobile(filePath, {
          loop: false,
          preload: 'auto',
          volume: 0.5
        });

        testResults.push({
          file: filePath,
          ...result,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error testing mobile audio:', filePath, error);
        testResults.push({
          file: filePath,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  const testAudioPlayback = async (filePath: string) => {
    try {
      console.log('Testing playback for:', filePath);
      
      const result = await MobileAudioHandler.loadAudioForMobile(filePath, {
        loop: false,
        preload: 'auto',
        volume: 0.5
      });

      if (result.success && result.audio) {
        const played = await MobileAudioHandler.playAudio(result.audio);
        console.log('Playback result:', played);
        
        setResults(prev => [...prev, {
          file: filePath,
          action: 'playback_test',
          success: played,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error('Playback test error:', error);
      setResults(prev => [...prev, {
        file: filePath,
        action: 'playback_test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const initializeMobileAudio = async () => {
    try {
      await MobileAudioHandler.initializeOnUserInteraction();
      console.log('Mobile audio initialized');
      setResults(prev => [...prev, {
        action: 'initialize',
        success: true,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to initialize mobile audio:', error);
      setResults(prev => [...prev, {
        action: 'initialize',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mobile Audio Debug</h1>
      
      {/* Mobile Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Mobile Audio Status</h2>
        <pre className="text-sm bg-white p-2 rounded overflow-auto">
          {JSON.stringify(mobileStatus, null, 2)}
        </pre>
      </div>
      
      <div className="space-y-4 mb-6">
        <Button onClick={initializeMobileAudio} variant="outline">
          Initialize Mobile Audio
        </Button>
        <Button onClick={testMobileAudio} disabled={loading}>
          {loading ? 'Testing...' : 'Test Mobile Audio Loading'}
        </Button>
      </div>

      {/* Individual Audio Tests */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Individual Audio Files</h2>
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_NOISE_CONFIGS.map((config) => (
            <Button
              key={config.id}
              onClick={() => testAudioPlayback(config.file)}
              variant="outline"
              className="text-xs"
            >
              Test {config.name}
            </Button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          {results.map((result, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h3 className="font-medium">
                {result.file ? result.file.split('/').pop() : result.action}
              </h3>
              <pre className="text-sm bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
